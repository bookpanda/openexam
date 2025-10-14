package handler

import (
	"context"
	"time"

	"storage/internal/domain"
	"storage/pkg/httpx"

	"github.com/gofiber/fiber/v2"
)

type FileHandler struct {
	svc      domain.FileService
	shareSvc domain.ShareService
}

func NewFileHandler(svc domain.FileService, shareSvc domain.ShareService) *FileHandler {
	return &FileHandler{svc: svc, shareSvc: shareSvc}
}

type GenerateRequest struct {
	FileIDs []string `json:"file_ids" validate:"required"`
}

func (h *FileHandler) Generate(c *fiber.Ctx) error {
	var req GenerateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.BadRequest(c, "invalid request body")
	}

	if len(req.FileIDs) == 0 {
		return httpx.BadRequest(c, "file_ids is required")
	}

	userId := c.Get("X-User-Id")
	files, err := h.svc.GetAllFiles(c.Context(), userId)
	if err != nil {
		return httpx.FromDomainError(c, err)
	}

	hasFileAccess := map[string]bool{}
	for _, file := range files {
		hasFileAccess[file.ID] = true
	}

	for _, fileID := range req.FileIDs {
		_, ok := hasFileAccess[fileID]
		if !ok {
			return httpx.BadRequest(c, "user does not have access to file: "+fileID)
		}
	}

	result, err := h.svc.Generate(c.Context(), req.FileIDs, userId)
	if err != nil {
		return httpx.FromDomainError(c, err)
	}

	return httpx.Ok(c, fiber.Map{
		"file_id": result.FileID,
		"key":     result.Key,
	})
}

func (h *FileHandler) Remove(c *fiber.Ctx) error {
	fileType := c.Query("file_type")
	userId := c.Query("user_id")
	file := c.Query("file")
	if fileType == "" || userId == "" || file == "" {
		return httpx.BadRequest(c, "file_type, user_id and file are required")
	}

	if err := h.svc.Remove(c.Context(), fileType, userId, file); err != nil {
		return httpx.FromDomainError(c, err)
	}
	return httpx.Ok(c, fiber.Map{"deleted": true})
}

func (h *FileHandler) GetAllFiles(c *fiber.Ctx) error {
	userId := c.Get("X-User-Id")
	if userId == "" {
		return httpx.BadRequest(c, "userId is required")
	}
	files, err := h.svc.GetAllFiles(c.Context(), userId)
	if err != nil {
		return httpx.FromDomainError(c, err)
	}
	return httpx.Ok(c, fiber.Map{"files": files})
}

func (h *FileHandler) GetFile(c *fiber.Ctx) error {
	userId := c.Get("X-User-Id")
	if userId == "" {
		return httpx.BadRequest(c, "userId is required")
	}
	fileId := c.Params("fileId")
	if fileId == "" {
		return httpx.BadRequest(c, "fileId is required")
	}

	file, err := h.svc.GetFile(c.Context(), fileId)
	if err != nil {
		return httpx.FromDomainError(c, err)
	}

	shares, err := h.shareSvc.GetSharesOfFile(c.Context(), file.ID, file.Key)
	if err != nil {
		return httpx.FromDomainError(c, err)
	}

	hasAccess := false
	for _, share := range shares {
		if share.UserID == userId {
			hasAccess = true
			break
		}
	}
	if !hasAccess {
		return httpx.BadRequest(c, "user does not have access to file")
	}

	return httpx.Ok(c, fiber.Map{"file": file, "shares": shares})
}

func (h *FileHandler) GetPresignedURL(c *fiber.Ctx) error {
	key := c.Query("key")
	if key == "" {
		return httpx.BadRequest(c, "key is required")
	}

	url, err := h.svc.GetPresignedURL(context.Background(), key, 10*time.Minute)
	if err != nil {
		return httpx.FromDomainError(c, err)
	}
	return httpx.Ok(c, fiber.Map{"url": url, "expiresIn": 600})
}

func (h *FileHandler) GetPresignedUploadURL(c *fiber.Ctx) error {
	userId := c.Get("X-User-Id")
	filename := c.Query("filename")
	if userId == "" || filename == "" {
		return httpx.BadRequest(c, "userId and filename are required")
	}

	url, key, err := h.svc.GetPresignedUploadURL(context.Background(), userId, filename, 10*time.Minute)
	if err != nil {
		return httpx.FromDomainError(c, err)
	}
	return httpx.Ok(c, fiber.Map{"url": url, "expiresIn": 600, "key": key})
}
