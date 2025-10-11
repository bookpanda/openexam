# Request Queue outputs
output "request_queue_arn" {
  description = "ARN of the SQS request queue"
  value       = aws_sqs_queue.request_queue.arn
}

output "request_queue_url" {
  description = "URL of the SQS request queue"
  value       = aws_sqs_queue.request_queue.url
}

output "request_queue_name" {
  description = "Name of the SQS request queue"
  value       = aws_sqs_queue.request_queue.name
}

# Response Queue outputs
output "response_queue_arn" {
  description = "ARN of the SQS response queue"
  value       = aws_sqs_queue.response_queue.arn
}

output "response_queue_url" {
  description = "URL of the SQS response queue"
  value       = aws_sqs_queue.response_queue.url
}

output "response_queue_name" {
  description = "Name of the SQS response queue"
  value       = aws_sqs_queue.response_queue.name
}
