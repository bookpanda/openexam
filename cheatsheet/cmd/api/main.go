package main

import (
	"context"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"

	"storage/internal/app"
	"storage/internal/config"
	"storage/internal/handler"
	"storage/internal/mq"
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
	metaRepo := repository.NewDynamoDBRepository(ddbClient, &cfg.DynamoDB)

	// Generation Tracker (5 minute timeout)
	generationTracker := service.NewGenerationTracker(5 * time.Minute)

	// SQS Publisher
	sqsPublisher := mq.NewSQSPublisher(cfg.AwsCfg, cfg.SQS.RequestQueueURL, cfg.SQS.ResponseQueueURL)

	// SQS Consumer for response queue (runs in background)
	sqsConsumer := mq.NewSQSConsumer(cfg.AwsCfg, cfg.SQS.ResponseQueueURL, generationTracker)
	go sqsConsumer.Start(context.Background())

	// Service + Handler
	fileSvc := service.NewFileService(repo, metaRepo, sqsPublisher, generationTracker, cfg.MaxUploadMB)
	fileHandler := handler.NewFileHandler(fileSvc)

	shareSvc := service.NewShareService(metaRepo)
	shareHandler := handler.NewShareHandler(shareSvc, fileSvc)

	// Routes
	app.SetupRoutes(appHttp, fileHandler, shareHandler)

	appHttp.Listen(":" + cfg.Port)
	log.Fatal(appHttp.Listen(":" + cfg.Port))
}
