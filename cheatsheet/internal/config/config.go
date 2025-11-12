package config

import (
	"context"
	"fmt"
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
	env := getEnv("ENV", "dev")
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
			FilesTable:  getEnv("FILES_TABLE", fmt.Sprintf("openexam-%s-files", env)),
			SharesTable: getEnv("SHARES_TABLE", fmt.Sprintf("openexam-%s-shares", env)),
		},
		SQS: SQSConfig{
			RequestQueueURL:  getEnv("SQS_REQUEST_QUEUE_URL", fmt.Sprintf("openexam-%s-queue", env)),
			ResponseQueueURL: getEnv("SQS_RESPONSE_QUEUE_URL", fmt.Sprintf("openexam-%s-queue-responses", env)),
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
