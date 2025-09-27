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
}

func NewFileService(repo domain.FileRepository, metaRepo domain.MetadataRepository, maxUploadMB int64) domain.FileService {
	return &FileServiceImpl{repo: repo, metaRepo: metaRepo, maxUploadMB: maxUploadMB}
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
	key := fmt.Sprintf("%s/%s_%s", userId, prefix, filename)

	if err := s.repo.Put(ctx, key, content, size, contentType); err != nil {
		return domain.FileObject{}, err
	}
	// return domain.FileObject{Key: key, Size: size, ContentType: contentType}, nil

	// Save metadata
	cheatsheet := domain.Cheatsheet{
		ID:        uuid.NewString(),
		UserID:    userId,
		CreatedAt: time.Now(),
		Name:      filename,
		Key:       fmt.Sprintf("%s_%s", prefix, filename), //key
	}
	if err := s.metaRepo.SaveCheatsheet(ctx, cheatsheet); err != nil {
		return domain.FileObject{}, err
	}

	return domain.FileObject{Key: key, Size: size, ContentType: contentType}, nil
}

func (s *FileServiceImpl) Download(ctx context.Context, key string) (io.ReadCloser, int64, string, error) {
	return s.repo.Get(ctx, key)
}

func (s *FileServiceImpl) Remove(ctx context.Context, key string) error {

	// "6531319021/676c8c_Ceph-Storage-Interface.png" → "676c8c_Ceph-Storage-Interface.png"
	parts := strings.SplitN(key, "/", 2)
	metaKey := key
	if len(parts) == 2 {
		metaKey = parts[1]
	}

	// Find cheatsheet from key before delete shares
	cheatsheet, err := s.metaRepo.FindCheatsheetByKey(ctx, metaKey)
	if err != nil {
		return err
	}

	// delete file from S3
	if err := s.repo.Delete(ctx, key); err != nil {
		return err
	}

	// delete metadata cheatsheet by key (not usrId/key)
	// if err := s.metaRepo.DeleteCheatsheetByKey(ctx, metaKey); err != nil {
	// 	return err
	// }
	// delete metadata cheatsheet
	if err := s.metaRepo.DeleteCheatsheet(ctx, cheatsheet.ID); err != nil {
		return err
	}

	// delete metadata shares
	if err := s.metaRepo.DeleteSharesByCheatsheetID(ctx, cheatsheet.ID); err != nil {
		return err
	}
	return nil
}

func (s *FileServiceImpl) GetPresignedURL(ctx context.Context, key string, ttl time.Duration) (string, error) {
	return s.repo.PresignGet(ctx, key, ttl)
}
