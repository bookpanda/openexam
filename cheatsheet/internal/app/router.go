package app

import (
	"storage/internal/handler"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, fh *handler.FileHandler, sh *handler.ShareHandler) {
	app.Get("/files", fh.GetAllFiles)                          // GET /files?key=...
	app.Delete("/files", fh.Remove)                            // DELETE /files?key=...
	app.Get("/files/presign", fh.GetPresignedURL)              // GET /files/presign?key=...
	app.Get("/files/presign/upload", fh.GetPresignedUploadURL) // GET /files/presign/upload?filename=...
	app.Post("/generate", fh.Generate)

	// share/unshare
	app.Post("/share", sh.Share)
	app.Post("/unshare", sh.Unshare)
}
