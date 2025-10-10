# Lambda function that generates cheatsheets from SQS
resource "aws_lambda_function" "generator" {
  filename         = data.archive_file.generator_zip.output_path
  function_name    = "${var.app_name}-s3-generator"
  role             = aws_iam_role.lambda_role.arn
  handler          = "generator.handler"
  source_code_hash = data.archive_file.generator_zip.output_base64sha256
  runtime          = "python3.12"
  timeout          = 60
  memory_size      = 256

  environment {
    variables = {
      BUCKET_NAME               = var.bucket_name
      SOURCE_PREFIX             = "slide"
      TARGET_PREFIX             = "cheatsheets"
      SLIDES_TABLE_NAME         = var.slides_table_name
      CHEATSHEETS_TABLE_NAME    = var.cheatsheets_table_name
      MAX_CONTENT_PREVIEW_CHARS = "500"
      MAX_BINARY_PREVIEW_BYTES  = "100"
    }
  }
}

# Create Lambda deployment package from modular source
data "archive_file" "generator_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../generator/src"
  output_path = "${path.module}/generator_function.zip"
  excludes    = ["__pycache__", "*.pyc", "*.pyo", ".pytest_cache", ".mypy_cache"]
}

# SQS trigger for Lambda
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = var.queue_arn
  function_name    = aws_lambda_function.generator.arn
  batch_size       = 10
  enabled          = true

  # Optional: Configure how Lambda handles failures
  function_response_types = ["ReportBatchItemFailures"]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.generator.function_name}"
  retention_in_days = 7
}

