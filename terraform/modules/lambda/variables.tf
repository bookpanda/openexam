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

variable "queue_arn" {
  description = "SQS queue ARN"
  type        = string
}

variable "slides_table_name" {
  description = "DynamoDB slides table name"
  type        = string
}

variable "slides_table_arn" {
  description = "DynamoDB slides table ARN"
  type        = string
}

variable "cheatsheets_table_name" {
  description = "DynamoDB cheatsheets table name"
  type        = string
}

variable "cheatsheets_table_arn" {
  description = "DynamoDB cheatsheets table ARN"
  type        = string
}

