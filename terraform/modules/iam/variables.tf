variable "app_name" {
  type = string
}

variable "s3_policy_arn" {
  type = string
}

variable "request_queue_arn" {
  description = "ARN of the SQS request queue"
  type        = string
}

variable "response_queue_arn" {
  description = "ARN of the SQS response queue"
  type        = string
}
