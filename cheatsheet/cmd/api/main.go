package main

import (
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"

	"storage/internal/app"
	"storage/internal/config"
	"storage/internal/handler"
	"storage/internal/repository"
	"storage/internal/service"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	appHttp := fiber.New()
	for _, m := range app.Middlewares() {
		appHttp.Use(m)
	}

	s3Client := s3.NewFromConfig(cfg.AwsCfg)
	repo := repository.NewS3Repository(s3Client, cfg.Bucket)

	// DynamoDB
	ddbClient := dynamodb.NewFromConfig(cfg.AwsCfg)
	metaRepo := repository.NewDynamoDBRepository(ddbClient, "cheatsheets", "shares")

	svc := service.NewFileService(repo, metaRepo, cfg.MaxUploadMB)
	fh := handler.NewFileHandler(svc)

	shareSvc := service.NewShareService(metaRepo)
	sh := handler.NewShareHandler(shareSvc)

	app.SetupRoutes(appHttp, fh, sh)

	appHttp.Listen(":" + cfg.Port)
}
