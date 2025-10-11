package config

import (
	"context"
	"log"
	"os"
	"strconv"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
)

type AppConfig struct {
	Port        string
	Region      string
	Bucket      string
	MaxUploadMB int64
	AwsCfg      aws.Config
	DynamoDB    DynamoDBConfig
	SQS         SQSConfig
}

type DynamoDBConfig struct {
	FilesTable  string
	SharesTable string
}

type SQSConfig struct {
	RequestQueueURL  string
	ResponseQueueURL string
}

func Load() AppConfig {
	port := getEnv("PORT", "3000")
	region := getEnv("AWS_REGION", "ap-southeast-1")
	bucket := mustEnv("S3_BUCKET")
	maxMB := int64(getInt("MAX_UPLOAD_MB", 20))

	awsCfg, err := config.LoadDefaultConfig(
		ctx(),
		config.WithRegion(region),
	)
	if err != nil {
		log.Fatalf("load aws config: %v", err)
	}

	return AppConfig{
		Port:        port,
		Region:      region,
		Bucket:      bucket,
		MaxUploadMB: maxMB,
		AwsCfg:      awsCfg,
		DynamoDB: DynamoDBConfig{
			FilesTable:  getEnv("FILES_TABLE", "openexam-files"),
			SharesTable: getEnv("SHARES_TABLE", "openexam-shares"),
		},
		SQS: SQSConfig{
			RequestQueueURL:  getEnv("SQS_REQUEST_QUEUE_URL", "openexam-queue"),
			ResponseQueueURL: getEnv("SQS_RESPONSE_QUEUE_URL", "openexam-queue-responses"),
		},
	}
}

func mustEnv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		log.Fatalf("missing env %s", k)
	}
	return v
}
func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
func getInt(k string, def int) int {
	if v := os.Getenv(k); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return def
}

func ctx() context.Context { return context.Background() }
