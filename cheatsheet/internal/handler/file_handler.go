package handler

import (
	"context"
	"time"

	"storage/internal/domain"
	"storage/pkg/httpx"

	"github.com/gofiber/fiber/v2"
)

type FileHandler struct {
	svc domain.FileService
}

func NewFileHandler(svc domain.FileService) *FileHandler { return &FileHandler{svc: svc} }

func (h *FileHandler) Upload(c *fiber.Ctx) error {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return httpx.BadRequest(c, "file is required")
	}

	f, err := fileHeader.Open()
	if err != nil {
		return httpx.Internal(c, err)
	}
	defer f.Close()

	userId := c.Get("X-User-Id")
	//userId := c.Query("userId")
	if userId == "" {
		userId = "6531319021" // dev/test
	}

	obj, err := h.svc.Upload(
		c.Context(),
		userId,
		fileHeader.Filename,
		f,
		fileHeader.Size,
		fileHeader.Header.Get("Content-Type"),
	)
	if err != nil {
		return httpx.FromDomainError(c, err)
	}

	return httpx.Ok(c, fiber.Map{"key": obj.Key, "size": obj.Size, "contentType": obj.ContentType})
}

func (h *FileHandler) Download(c *fiber.Ctx) error {
	key := c.Query("key")
	if key == "" {
		return httpx.BadRequest(c, "key is required")
	}

	rc, _, contentType, err := h.svc.Download(c.Context(), key)
	if err != nil {
		return httpx.FromDomainError(c, err)
	}
	defer rc.Close()

	c.Set("Content-Type", contentType)
	return c.SendStream(rc)
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

func (h *FileHandler) GetPresignedURL(c *fiber.Ctx) error {
	// key := c.Params("key")
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
