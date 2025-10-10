resource "aws_sqs_queue" "cheatsheet_queue" {
  name                       = "${var.app_name}-queue"
  visibility_timeout_seconds = 30    # How long a message stays invisible after being received
  message_retention_seconds  = 86400 # 1 day
  delay_seconds              = 0
  receive_wait_time_seconds  = 10 # Enable long polling (reduce empty responses)

  # Disable KMS encryption to avoid S3 notification issues
  # If you need encryption, you'll need to add additional KMS permissions
  # kms_master_key_id = "alias/aws/sqs"
}

resource "aws_sqs_queue_policy" "s3_sqs_policy" {
  queue_url = aws_sqs_queue.cheatsheet_queue.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action   = "SQS:SendMessage"
        Resource = aws_sqs_queue.cheatsheet_queue.arn
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

  depends_on = [aws_sqs_queue_policy.s3_sqs_policy]
}
