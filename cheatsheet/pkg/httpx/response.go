package httpx

import (
	"strconv"

	"storage/internal/domain"

	"github.com/gofiber/fiber/v2"
)

func Ok(c *fiber.Ctx, data any) error {
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"success": true, "data": data})
}
func BadRequest(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"success": false, "error": msg})
}
func NotFound(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"success": false, "error": msg})
}
func Internal(c *fiber.Ctx, err error) error {
	return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "error": err.Error()})
}

func FromDomainError(c *fiber.Ctx, err error) error {
	switch err {
	case domain.ErrNotFound:
		return NotFound(c, err.Error())
	case domain.ErrTooLarge, domain.ErrInvalidType:
		return BadRequest(c, err.Error())
	default:
		return Internal(c, err)
	}
}

// small util (ถ้าไม่อยากเพิ่มไฟล์ใหม่)
func Itoa64(v int64) string { return strconv.FormatInt(v, 10) }
