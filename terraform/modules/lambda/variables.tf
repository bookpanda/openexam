variable "app_name" {
  description = "Application name"
  type        = string
}

variable "bucket_name" {
  description = "S3 bucket name"
  type        = string
}

variable "bucket_id" {
  description = "S3 bucket id"
  type        = string
}

variable "request_queue_arn" {
  description = "ARN of the SQS request queue"
  type        = string
}

variable "response_queue_arn" {
  description = "ARN of the SQS response queue"
  type        = string
}

variable "response_queue_url" {
  description = "URL of the SQS response queue"
  type        = string
}

variable "files_table_name" {
  description = "DynamoDB files table name"
  type        = string
}

variable "files_table_arn" {
  description = "DynamoDB files table ARN"
  type        = string
}

variable "shares_table_name" {
  description = "DynamoDB shares table name"
  type        = string
}

variable "shares_table_arn" {
  description = "DynamoDB shares table ARN"
  type        = string
}

variable "gemini_api_key" {
  description = "Google Gemini API key for AI generation"
  type        = string
  sensitive   = true
}
