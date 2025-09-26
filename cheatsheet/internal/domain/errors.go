package domain

import "errors"

var (
	ErrNotFound      = errors.New("file not found")
	ErrTooLarge      = errors.New("file too large")
	ErrInvalidType   = errors.New("invalid content type")
	ErrStorageFailed = errors.New("storage operation failed")
)
