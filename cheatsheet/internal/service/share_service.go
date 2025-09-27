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

func (s *ShareServiceImpl) Share(ctx context.Context, userId, cheatsheetId string) error {
	return s.metaRepo.ShareCheatsheet(ctx, userId, cheatsheetId)
}

func (s *ShareServiceImpl) Unshare(ctx context.Context, userId, cheatsheetId string) error {
	return s.metaRepo.UnshareCheatsheet(ctx, userId, cheatsheetId)
}
