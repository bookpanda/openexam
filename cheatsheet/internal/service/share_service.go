package service

import (
	"context"

	"storage/internal/domain"
)

type ShareServiceImpl struct {
	metaRepo domain.MetadataRepository
}

func NewShareService(metaRepo domain.MetadataRepository) *ShareServiceImpl {
	return &ShareServiceImpl{metaRepo: metaRepo}
}

func (s *ShareServiceImpl) GetSharesOfFile(ctx context.Context, userId, key string) ([]domain.Share, error) {
	return s.metaRepo.GetSharesOfFile(ctx, userId, key)
}

func (s *ShareServiceImpl) Share(ctx context.Context, userId, key, fileId string) error {
	return s.metaRepo.ShareFile(ctx, userId, key, fileId)
}

func (s *ShareServiceImpl) Unshare(ctx context.Context, userId, key string) error {
	return s.metaRepo.UnshareFile(ctx, userId, key)
}
