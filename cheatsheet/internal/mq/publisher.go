package mq

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/rabbitmq/amqp091-go"
)

type Publisher struct {
	mq *MQ
}

func NewPublisher(mq *MQ) *Publisher {
	return &Publisher{mq: mq}
}

func (p *Publisher) Publish(routingKey string, payload interface{}) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = p.mq.Channel.PublishWithContext(ctx,
		p.mq.Exchange, // exchange
		routingKey,    // routing key (ex: file.upload, file.delete)
		false,         // mandatory
		false,         // immediate
		amqp091.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)
	if err != nil {
		log.Printf("Failed to publish: %v", err)
		return err
	}
	log.Printf(" [x] Sent %s: %s", routingKey, string(body))
	return nil
}
