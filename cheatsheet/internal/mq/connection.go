package mq

import (
	"log"
	"os"

	amqp "github.com/rabbitmq/amqp091-go"
)

type MQ struct {
	Conn     *amqp.Connection
	Channel  *amqp.Channel
	Exchange string
}

// NewMQ creates connection and declares topic exchange
func NewMQ() *MQ {
	url := os.Getenv("AMQP_URL")
	if url == "" {
		url = "amqp://admin:openExam2025@localhost:5672/"
	}
	exchange := os.Getenv("AMQP_EXCHANGE")
	if exchange == "" {
		exchange = "storage.topic"
	}

	conn, err := amqp.Dial(url)
	if err != nil {
		log.Fatalf("Failed to connect RabbitMQ: %v", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("Failed to open channel: %v", err)
	}

	// Declare Topic exchange
	if err := ch.ExchangeDeclare(
		exchange, // name
		"topic",  // type
		true,     // durable
		false,    // auto-deleted
		false,    // internal
		false,    // no-wait
		nil,      // args
	); err != nil {
		log.Fatalf("Failed to declare exchange: %v", err)
	}

	return &MQ{Conn: conn, Channel: ch, Exchange: exchange}
}
