package service

import (
	"context"
	"fmt"
	"io"
	"mime"
	"path/filepath"
	"strings"
	"time"

	"storage/internal/domain"

	"github.com/google/uuid"
)

type FileServiceImpl struct {
	repo        domain.FileRepository
	maxUploadMB int64
}

func NewFileService(repo domain.FileRepository, maxUploadMB int64) domain.FileService {
	return &FileServiceImpl{repo: repo, maxUploadMB: maxUploadMB}
}

func (s *FileServiceImpl) Upload(ctx context.Context, userId string, filename string, content io.Reader, size int64, contentType string) (domain.FileObject, error) {
	if size > s.maxUploadMB*1024*1024 {
		return domain.FileObject{}, domain.ErrTooLarge
	}
	// If contentType is empty, try to guess from file extension
	if contentType == "" {
		ext := strings.ToLower(filepath.Ext(filename))
		contentType = mime.TypeByExtension(ext)
		if contentType == "" {
			contentType = "application/octet-stream"
		}
	}
	// Generate a safe and unique key name
	prefix := uuid.NewString()[0:6]
	key := fmt.Sprintf("%s/%s_%s", userId, prefix, filename)

	if err := s.repo.Put(ctx, key, content, size, contentType); err != nil {
		return domain.FileObject{}, err
	}
	return domain.FileObject{Key: key, Size: size, ContentType: contentType}, nil
}

func (s *FileServiceImpl) Download(ctx context.Context, key string) (io.ReadCloser, int64, string, error) {
	return s.repo.Get(ctx, key)
}

func (s *FileServiceImpl) Remove(ctx context.Context, key string) error {
	return s.repo.Delete(ctx, key)
}

func (s *FileServiceImpl) GetPresignedURL(ctx context.Context, key string, ttl time.Duration) (string, error) {
	return s.repo.PresignGet(ctx, key, ttl)
}
