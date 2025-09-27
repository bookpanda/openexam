package handler

import (
	"storage/internal/domain"
	"storage/pkg/httpx"

	"github.com/gofiber/fiber/v2"
)

type ShareHandler struct {
	svc domain.ShareService
}

func NewShareHandler(svc domain.ShareService) *ShareHandler {
	return &ShareHandler{svc: svc}
}

func (h *ShareHandler) Share(c *fiber.Ctx) error {
	userId := c.FormValue("userId")
	cheatsheetId := c.FormValue("cheatsheetId")
	if err := h.svc.Share(c.Context(), userId, cheatsheetId); err != nil {
		return httpx.FromDomainError(c, err)
	}
	return httpx.Ok(c, fiber.Map{"shared": true})
}

func (h *ShareHandler) Unshare(c *fiber.Ctx) error {
	userId := c.FormValue("userId")
	cheatsheetId := c.FormValue("cheatsheetId")
	if err := h.svc.Unshare(c.Context(), userId, cheatsheetId); err != nil {
		return httpx.FromDomainError(c, err)
	}
	return httpx.Ok(c, fiber.Map{"unshared": true})
}
