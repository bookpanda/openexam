package mq

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"storage/internal/service"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/aws/aws-sdk-go-v2/service/sqs/types"
)

type GenerateResponse struct {
	RequestID string `json:"request_id"`
	FileID    string `json:"file_id"`
	Key       string `json:"key"`
	Success   bool   `json:"success"`
	Error     string `json:"error,omitempty"`
}

type SQSConsumer struct {
	client   *sqs.Client
	queueURL string
	tracker  *service.GenerationTracker
}

func NewSQSConsumer(awsCfg aws.Config, queueURL string, tracker *service.GenerationTracker) *SQSConsumer {
	return &SQSConsumer{
		client:   sqs.NewFromConfig(awsCfg),
		queueURL: queueURL,
		tracker:  tracker,
	}
}

// Start begins consuming messages from the response queue
func (c *SQSConsumer) Start(ctx context.Context) {
	log.Printf("Starting SQS consumer for queue: %s", c.queueURL)

	for {
		select {
		case <-ctx.Done():
			log.Println("SQS consumer shutting down")
			return
		default:
			c.pollMessages(ctx)
		}
	}
}

func (c *SQSConsumer) pollMessages(ctx context.Context) {
	result, err := c.client.ReceiveMessage(ctx, &sqs.ReceiveMessageInput{
		QueueUrl:            aws.String(c.queueURL),
		MaxNumberOfMessages: 10,
		WaitTimeSeconds:     20, // Long polling
		VisibilityTimeout:   30,
		AttributeNames:      []types.QueueAttributeName{"ApproximateReceiveCount"},
	})

	if err != nil {
		log.Printf("Error receiving messages: %v", err)
		time.Sleep(5 * time.Second)
		return
	}

	for _, message := range result.Messages {
		c.processMessage(ctx, message)
	}
}

func (c *SQSConsumer) processMessage(ctx context.Context, message types.Message) {
	var response GenerateResponse
	if err := json.Unmarshal([]byte(*message.Body), &response); err != nil {
		log.Printf("Error unmarshaling message: %v", err)
		c.deleteMessage(ctx, message.ReceiptHandle)
		return
	}

	log.Printf("Received generation response: requestId=%s, success=%v", response.RequestID, response.Success)

	// Complete the pending generation request
	result := service.GenerationResult{
		FileID: response.FileID,
		Key:    response.Key,
	}

	if !response.Success {
		if response.Error != "" {
			result.Error = &GenerationError{Message: response.Error}
		} else {
			result.Error = &GenerationError{Message: "generation failed"}
		}
	}

	if err := c.tracker.Complete(response.RequestID, result); err != nil {
		log.Printf("Error completing request %s: %v", response.RequestID, err)

		// Check receive count to avoid infinite retries
		receiveCount := c.getReceiveCount(message)
		if receiveCount > 3 {
			log.Printf("Message received %d times, deleting to prevent infinite loop", receiveCount)
			c.deleteMessage(ctx, message.ReceiptHandle)
		}
		// Otherwise don't delete - it will retry
		return
	}

	c.deleteMessage(ctx, message.ReceiptHandle)
}

func (c *SQSConsumer) getReceiveCount(message types.Message) int {
	if message.Attributes == nil {
		return 1
	}

	if countStr, ok := message.Attributes["ApproximateReceiveCount"]; ok {
		var count int
		if _, err := fmt.Sscanf(countStr, "%d", &count); err == nil {
			return count
		}
	}

	return 1
}

func (c *SQSConsumer) deleteMessage(ctx context.Context, receiptHandle *string) {
	_, err := c.client.DeleteMessage(ctx, &sqs.DeleteMessageInput{
		QueueUrl:      aws.String(c.queueURL),
		ReceiptHandle: receiptHandle,
	})
	if err != nil {
		log.Printf("Error deleting message: %v", err)
	}
}

type GenerationError struct {
	Message string
}

func (e *GenerationError) Error() string {
	return e.Message
}
