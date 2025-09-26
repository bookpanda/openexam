package app

import (
	"storage/internal/handler"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, fh *handler.FileHandler) {
	app.Post("/upload", fh.Upload)
	app.Get("/files", fh.Download)                // GET /files?key=...
	app.Delete("/files", fh.Remove)               // DELETE /files?key=...
	app.Get("/files/presign", fh.GetPresignedURL) // GET /files/presign?key=...
}
