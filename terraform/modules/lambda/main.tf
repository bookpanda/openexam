# Lambda function that processes S3 upload events from SQS
resource "aws_lambda_function" "s3_processor" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.app_name}-s3-processor"
  role             = aws_iam_role.lambda_role.arn
  handler          = "main.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.12"
  timeout          = 60
  memory_size      = 256

  environment {
    variables = {
      BUCKET_NAME               = var.bucket_name
      SOURCE_PREFIX             = "slide"
      TARGET_PREFIX             = "cheatsheets"
      CHEATSHEETS_TABLE_NAME    = var.cheatsheets_table_name
      MAX_CONTENT_PREVIEW_CHARS = "500"
      MAX_BINARY_PREVIEW_BYTES  = "100"
    }
  }

  tags = {
    Name = "${var.app_name}-lambda"
  }
}

# Create Lambda deployment package from modular source
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../generator/src"
  output_path = "${path.module}/lambda_function.zip"
  excludes    = ["__pycache__", "*.pyc", "*.pyo", ".pytest_cache", ".mypy_cache"]
}

# IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.app_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# Policy for Lambda to read from SQS, access S3, and write to DynamoDB
resource "aws_iam_role_policy" "lambda_sqs_s3_dynamodb_policy" {
  name = "${var.app_name}-lambda-sqs-s3-dynamodb-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = var.queue_arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:PutObjectTagging",
          "s3:CopyObject"
        ]
        Resource = "arn:aws:s3:::${var.bucket_name}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          var.cheatsheets_table_arn,
          "${var.cheatsheets_table_arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# SQS trigger for Lambda
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = var.queue_arn
  function_name    = aws_lambda_function.s3_processor.arn
  batch_size       = 10
  enabled          = true

  # Optional: Configure how Lambda handles failures
  function_response_types = ["ReportBatchItemFailures"]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.s3_processor.function_name}"
  retention_in_days = 7
}

