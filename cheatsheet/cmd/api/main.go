package main

import (
	"log"

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
	metaRepo := repository.NewDynamoDBRepository(ddbClient, &cfg.DynamoDB)

	// RabbitMQ
	// mqConn := mq.NewMQ()
	// defer mqConn.Conn.Close()
	// defer mqConn.Channel.Close()
	// pub := mq.NewPublisher(mqConn)

	// Service + Handler
	fileSvc := service.NewFileService(repo, metaRepo, cfg.MaxUploadMB)
	fileHandler := handler.NewFileHandler(fileSvc)

	shareSvc := service.NewShareService(metaRepo)
	shareHandler := handler.NewShareHandler(shareSvc)

	// Routes
	app.SetupRoutes(appHttp, fileHandler, shareHandler)

	// Example consumer: listen file upload events
	// go mq.StartConsumer(mqConn, "log-queue", "file.upload")

	appHttp.Listen(":" + cfg.Port)
	log.Fatal(appHttp.Listen(":" + cfg.Port))
}
