package app

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func Middlewares() []fiber.Handler {
	return []fiber.Handler{
		logger.New(),
	}
}
