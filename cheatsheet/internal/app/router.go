package app

import (
	"storage/internal/handler"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, fh *handler.FileHandler, sh *handler.ShareHandler) {
	app.Post("/upload", fh.Upload)
	app.Get("/files", fh.Download)                // GET /files?key=...
	app.Delete("/files", fh.Remove)               // DELETE /files?key=...
	app.Get("/files/presign", fh.GetPresignedURL) // GET /files/presign?key=...

	// share/unshare
	app.Post("/share", sh.Share)
	app.Post("/unshare", sh.Unshare)
}
