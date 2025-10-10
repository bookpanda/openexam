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
	repo        domain.FileRepository     // S3
	metaRepo    domain.MetadataRepository // DynamoDB
	maxUploadMB int64
	// publisher   *mq.Publisher
}

func NewFileService(repo domain.FileRepository, metaRepo domain.MetadataRepository, maxUploadMB int64) domain.FileService {
	return &FileServiceImpl{
		repo:     repo,
		metaRepo: metaRepo,
		// publisher:   publisher,
		maxUploadMB: maxUploadMB,
	}
}

func (s *FileServiceImpl) Upload(ctx context.Context, userId, filename string, content io.Reader, size int64, contentType string) (domain.FileObject, error) {
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
	key := fmt.Sprintf("cheatsheets/%s/%s_%s", userId, prefix, filename)

	if err := s.repo.Put(ctx, key, content, size, contentType); err != nil {
		return domain.FileObject{}, err
	}

	// Save metadata
	// cheatsheet := domain.Cheatsheet{
	// 	ID:        uuid.NewString(),
	// 	UserID:    userId,
	// 	CreatedAt: time.Now(),
	// 	Name:      filename,
	// 	Key:       fmt.Sprintf("%s_%s", prefix, filename), //key
	// }
	// if err := s.metaRepo.SaveCheatsheet(ctx, cheatsheet); err != nil {
	// 	return domain.FileObject{}, err
	// }

	// Build file object
	fileObj := domain.FileObject{
		Key:         key,
		Size:        size,
		ContentType: contentType,
	}

	return fileObj, nil
}

func (s *FileServiceImpl) Download(ctx context.Context, key string) (io.ReadCloser, int64, string, error) {
	return s.repo.Get(ctx, key)
}

func (s *FileServiceImpl) Remove(ctx context.Context, fileType string, userId string, file string) error {
	key := fmt.Sprintf("%s/%s/%s", fileType, userId, file)

	// // Find file from key before delete shares
	// fileObj, err := s.metaRepo.FindCheatsheetByKey(ctx, key)
	// if err != nil {
	// 	return err
	// }

	// // delete metadata shares for this file
	// if err := s.metaRepo.DeleteSharesByFileID(ctx, fileObj.ID); err != nil {
	// 	return err
	// }

	// delete file from S3
	if err := s.repo.Delete(ctx, key); err != nil {
		return err
	}

	return nil
}

func (s *FileServiceImpl) GetAllFiles(ctx context.Context, userId string) ([]domain.File, error) {
	return s.metaRepo.GetAllFiles(ctx, userId)
}

func (s *FileServiceImpl) GetPresignedURL(ctx context.Context, key string, ttl time.Duration) (string, error) {
	return s.repo.PresignGet(ctx, key, ttl)
}

func (s *FileServiceImpl) GetPresignedUploadURL(ctx context.Context, userId string, filename string, ttl time.Duration) (string, string, error) {
	prefix := uuid.NewString()[0:6]
	key := fmt.Sprintf("slides/%s/%s_%s", userId, prefix, filename)

	result, err := s.repo.PresignPut(ctx, key, ttl)
	if err != nil {
		return "", "", err
	}
	return result, key, nil
}
