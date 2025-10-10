package domain

import (
	"context"
	"io"
	"time"
)

type FileRepository interface {
	Put(ctx context.Context, key string, r io.Reader, size int64, contentType string) error
	Get(ctx context.Context, key string) (io.ReadCloser, int64, string, error)
	Delete(ctx context.Context, key string) error
	PresignGet(ctx context.Context, key string, ttl time.Duration) (string, error)
	PresignPut(ctx context.Context, key string, ttl time.Duration) (string, error)
}

type FileService interface {
	Upload(ctx context.Context, userId string, filename string, content io.Reader, size int64, contentType string) (FileObject, error)
	Download(ctx context.Context, key string) (io.ReadCloser, int64, string, error)
	Remove(ctx context.Context, key string) error
	GetPresignedURL(ctx context.Context, key string, ttl time.Duration) (string, error)
	GetPresignedUploadURL(ctx context.Context, userId string, filename string, ttl time.Duration) (string, error)
}

type MetadataRepository interface {
	SaveCheatsheet(ctx context.Context, c Cheatsheet) error
	DeleteCheatsheet(ctx context.Context, id string) error
	ShareCheatsheet(ctx context.Context, userId, cheatsheetId string) error
	UnshareCheatsheet(ctx context.Context, userId, cheatsheetId string) error

	DeleteCheatsheetByKey(ctx context.Context, key string) error
	DeleteSharesByCheatsheetID(ctx context.Context, cheatsheetId string) error
	FindCheatsheetByKey(ctx context.Context, key string) (Cheatsheet, error)
}

type ShareService interface {
	Share(ctx context.Context, userId, cheatsheetId string) error
	Unshare(ctx context.Context, userId, cheatsheetId string) error
}
