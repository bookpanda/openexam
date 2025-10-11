package handler

import (
	"context"
	"time"

	"storage/internal/domain"
	"storage/pkg/httpx"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type FileHandler struct {
	svc domain.FileService
}

func NewFileHandler(svc domain.FileService) *FileHandler { return &FileHandler{svc: svc} }

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

	// 3. Call SQS with fileIds and userId
	fileID := uuid.New().String()
	key := uuid.New().String()

	return httpx.Ok(c, fiber.Map{
		"file_id": fileID,
		"key":     key,
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
