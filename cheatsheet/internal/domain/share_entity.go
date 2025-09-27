package domain

type Share struct {
	UserID       string `dynamodbav:"userId"`
	CheatsheetID string `dynamodbav:"cheatsheetId"`
}
