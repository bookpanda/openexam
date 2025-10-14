package repository

import (
	"context"
	"io"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3types "github.com/aws/aws-sdk-go-v2/service/s3/types"

	"storage/internal/domain"
)

type S3Repository struct {
	client    *s3.Client
	presigner *s3.PresignClient
	bucket    string
}

func NewS3Repository(client *s3.Client, bucket string) *S3Repository {
	return &S3Repository{
		client:    client,
		presigner: s3.NewPresignClient(client),
		bucket:    bucket,
	}
}

func (r *S3Repository) Put(ctx context.Context, key string, rd io.Reader, size int64, contentType string) error {
	uploader := manager.NewUploader(r.client)
	_, err := uploader.Upload(ctx, &s3.PutObjectInput{
		Bucket:      &r.bucket,
		Key:         &key,
		Body:        rd,
		ContentType: &contentType,
		ACL:         s3types.ObjectCannedACLPrivate,
	})
	if err != nil {
		return domain.ErrStorageFailed
	}
	return nil
}

func (r *S3Repository) Delete(ctx context.Context, key string) error {
	_, err := r.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: &r.bucket,
		Key:    &key,
	})
	if err != nil {
		log.Println("s3 delete error:", err)
		return domain.ErrStorageFailed
	}
	return nil
}

func (r *S3Repository) PresignGet(ctx context.Context, key string, ttl time.Duration) (string, error) {
	req, err := r.presigner.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: &r.bucket,
		Key:    &key,
	}, s3.WithPresignExpires(ttl))
	if err != nil {
		return "", domain.ErrStorageFailed
	}
	return req.URL, nil
}

func (r *S3Repository) PresignPut(ctx context.Context, key string, ttl time.Duration) (string, error) {
	req, err := r.presigner.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket: &r.bucket,
		Key:    &key,
	}, s3.WithPresignExpires(ttl))
	if err != nil {
		return "", domain.ErrStorageFailed
	}
	return req.URL, nil
}
