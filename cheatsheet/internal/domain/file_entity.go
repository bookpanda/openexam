package domain

import "time"

type FileObject struct {
	Key         string
	Size        int64
	ContentType string
}

type File struct {
	ID        string    `dynamodbav:"id"`
	UserID    string    `dynamodbav:"userId"`
	CreatedAt time.Time `dynamodbav:"createdAt"`
	Name      string    `dynamodbav:"name"`
	Key       string    `dynamodbav:"key"`
}
