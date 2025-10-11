package domain

type Share struct {
	UserID string `dynamodbav:"userId"`
	Key    string `dynamodbav:"key"`
	FileID string `dynamodbav:"fileId"`
}
