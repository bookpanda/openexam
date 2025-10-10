variable "region" {
  description = "The region in which the VPC will be created"
  type        = string
}

variable "app_name" {
  description = "The name of the app"
  type        = string
}

variable "sns_topic_endpoint" {
  description = "The endpoint for the SNS topic to send notifications to"
  type        = string
}

