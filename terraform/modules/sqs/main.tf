# Request Queue - receives generation requests from cheatsheet service
# Note: S3 events are sent directly to tracker Lambda (see modules/lambda/tracker.tf)
# This request queue is only used for generation requests from the cheatsheet service
resource "aws_sqs_queue" "request_queue" {
  name                       = "${var.app_name}-queue"
  visibility_timeout_seconds = 360   # 6 minutes (should be >= Lambda timeout * 6)
  message_retention_seconds  = 86400 # 1 day
  delay_seconds              = 0
  receive_wait_time_seconds  = 10 # Enable long polling (reduce empty responses)

  # Disable KMS encryption to avoid S3 notification issues
  # If you need encryption, you'll need to add additional KMS permissions
  # kms_master_key_id = "alias/aws/sqs"
}

# Response Queue - receives generation results from Lambda
resource "aws_sqs_queue" "response_queue" {
  name                       = "${var.app_name}-queue-responses"
  visibility_timeout_seconds = 30    # Short timeout for response processing
  message_retention_seconds  = 86400 # 1 day
  delay_seconds              = 0
  receive_wait_time_seconds  = 20 # Long polling for consumer
}
