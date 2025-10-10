resource "aws_sqs_queue" "cheatsheet_queue" {
  name                       = "${var.app_name}-queue"
  visibility_timeout_seconds = 30    # How long a message stays invisible after being received
  message_retention_seconds  = 86400 # 1 day
  delay_seconds              = 0
  receive_wait_time_seconds  = 10 # Enable long polling (reduce empty responses)

  # Enable server-side encryption (optional)
  kms_master_key_id = "alias/aws/sqs"
}

resource "aws_sqs_queue_policy" "s3_sqs_policy" {
  queue_url = aws_sqs_queue.cheatsheet_queue.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "SQS:SendMessage"
        Resource  = aws_sqs_queue.cheatsheet_queue.arn
        Condition = {
          ArnLike = {
            "aws:SourceArn" = "arn:aws:s3:::${var.bucket_name}"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_notification" "s3_to_sqs" {
  bucket = var.bucket_id

  queue {
    queue_arn = aws_sqs_queue.cheatsheet_queue.arn
    events    = ["s3:ObjectCreated:*"]
  }
}

# resource "aws_sns_topic_subscription" "sns_to_backend" {
#   topic_arn = aws_sns_topic.s3_uploads.arn
#   protocol  = "https"
#   endpoint  = var.sns_topic_endpoint
# }
