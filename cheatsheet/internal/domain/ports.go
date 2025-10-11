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
	Remove(ctx context.Context, fileType string, userId string, file string) error
	GetPresignedURL(ctx context.Context, key string, ttl time.Duration) (string, error)
	GetPresignedUploadURL(ctx context.Context, userId string, filename string, ttl time.Duration) (string, string, error)
	GetAllFiles(ctx context.Context, userId string) ([]File, error)
	GetFile(ctx context.Context, id string) (File, error)
}

type MetadataRepository interface {
	ShareFile(ctx context.Context, userId, key, fileId string) error
	UnshareFile(ctx context.Context, userId, key string) error
	// DeleteSharesByFileID(ctx context.Context, fileId string) error
	// FindFileByKey(ctx context.Context, key string) (File, error)
	GetAllFiles(ctx context.Context, userId string) ([]File, error)
	GetFile(ctx context.Context, id string) (File, error)
}

type ShareService interface {
	Share(ctx context.Context, userId, key, fileId string) error
	Unshare(ctx context.Context, userId, key string) error
}
