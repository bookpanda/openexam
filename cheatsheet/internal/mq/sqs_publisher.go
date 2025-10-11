package mq

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

type GenerateMessage struct {
	FileIDs          []string `json:"fileIds"`
	UserID           string   `json:"userId"`
	RequestID        string   `json:"requestId"`
	ResponseQueueURL string   `json:"responseQueueUrl"`
}

type SQSPublisher interface {
	PublishGenerateRequest(ctx context.Context, fileIDs []string, userID string, requestID string) error
}

type SQSPublisherImpl struct {
	client           *sqs.Client
	requestQueueURL  string
	responseQueueURL string
}

func NewSQSPublisher(awsCfg aws.Config, requestQueueURL string, responseQueueURL string) SQSPublisher {
	return &SQSPublisherImpl{
		client:           sqs.NewFromConfig(awsCfg),
		requestQueueURL:  requestQueueURL,
		responseQueueURL: responseQueueURL,
	}
}

func (p *SQSPublisherImpl) PublishGenerateRequest(ctx context.Context, fileIDs []string, userID string, requestID string) error {
	msg := GenerateMessage{
		FileIDs:          fileIDs,
		UserID:           userID,
		RequestID:        requestID,
		ResponseQueueURL: p.responseQueueURL,
	}

	body, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	_, err = p.client.SendMessage(ctx, &sqs.SendMessageInput{
		QueueUrl:    aws.String(p.requestQueueURL),
		MessageBody: aws.String(string(body)),
	})

	return err
}
