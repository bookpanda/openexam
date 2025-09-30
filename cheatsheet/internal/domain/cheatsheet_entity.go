package domain

import "time"

type Cheatsheet struct {
	ID        string    `dynamodbav:"id"`
	UserID    string    `dynamodbav:"userId"`
	CreatedAt time.Time `dynamodbav:"createdAt"`
	Name      string    `dynamodbav:"name"`
	Key       string    `dynamodbav:"key"`
}
