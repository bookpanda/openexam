package mq

import (
	"log"
)

func StartConsumer(mq *MQ, queueName, bindingKey string) {
	q, err := mq.Channel.QueueDeclare(
		queueName, // name
		true,      // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		nil,       // args
	)
	if err != nil {
		log.Fatalf("Failed to declare queue: %v", err)
	}

	if err := mq.Channel.QueueBind(
		q.Name,      // queue
		bindingKey,  // routing key
		mq.Exchange, // exchange
		false,
		nil,
	); err != nil {
		log.Fatalf("Failed to bind queue: %v", err)
	}

	msgs, err := mq.Channel.Consume(
		q.Name, "", true, false, false, false, nil,
	)
	if err != nil {
		log.Fatalf("Failed to consume: %v", err)
	}

	go func() {
		for d := range msgs {
			log.Printf(" [x] Received (%s): %s", bindingKey, d.Body)
		}
	}()
}
