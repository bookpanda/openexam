package handler

import (
	"storage/internal/domain"
	"storage/pkg/httpx"

	"github.com/gofiber/fiber/v2"
)

type ShareHandler struct {
	svc     domain.ShareService
	fileSvc domain.FileService
}

func NewShareHandler(svc domain.ShareService, fileSvc domain.FileService) *ShareHandler {
	return &ShareHandler{svc: svc, fileSvc: fileSvc}
}

func (h *ShareHandler) Share(c *fiber.Ctx) error {
	ownerId := c.Get("X-User-Id")
	userId := c.FormValue("user_id")
	fileId := c.FormValue("file_id")

	file, err := h.fileSvc.GetFile(c.Context(), fileId)
	if err != nil {
		return httpx.FromDomainError(c, err)
	}

	if ownerId != file.UserID {
		return httpx.BadRequest(c, "You are not the owner of this file")
	}

	if err := h.svc.Share(c.Context(), userId, file.Key, fileId); err != nil {
		return httpx.FromDomainError(c, err)
	}
	return httpx.Ok(c, fiber.Map{"shared": true})
}

func (h *ShareHandler) Unshare(c *fiber.Ctx) error {
	ownerId := c.Get("X-User-Id")
	userId := c.FormValue("user_id")
	fileId := c.FormValue("file_id")

	if ownerId == userId {
		return httpx.BadRequest(c, "You cannot unshare yourself")
	}

	file, err := h.fileSvc.GetFile(c.Context(), fileId)
	if err != nil {
		return httpx.FromDomainError(c, err)
	}

	if ownerId != file.UserID {
		return httpx.BadRequest(c, "You are not the owner of this file")
	}

	if err := h.svc.Unshare(c.Context(), userId, file.Key); err != nil {
		return httpx.FromDomainError(c, err)
	}
	return httpx.Ok(c, fiber.Map{"unshared": true})
}
