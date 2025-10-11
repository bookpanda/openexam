# Lambda function that generates cheatsheets from SQS
# Note: Package must be built first using generator/build_lambda.sh
resource "aws_lambda_function" "generator" {
  filename         = "${path.module}/generator_function.zip"
  function_name    = "${var.app_name}-s3-generator"
  role             = aws_iam_role.lambda_role.arn
  handler          = "generator.handler"
  source_code_hash = filebase64sha256("${path.module}/generator_function.zip")
  runtime          = "python3.12"
  timeout          = 60
  memory_size      = 256

  environment {
    variables = {
      AWS_REGION                = var.region
      BUCKET_NAME               = var.bucket_name
      SOURCE_PREFIX             = "slide"
      TARGET_PREFIX             = "cheatsheets"
      FILES_TABLE_NAME          = var.files_table_name
      MAX_CONTENT_PREVIEW_CHARS = "500"
      MAX_BINARY_PREVIEW_BYTES  = "100"
    }
  }
}

# SQS trigger for Lambda
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = var.request_queue_arn
  function_name    = aws_lambda_function.generator.arn
  batch_size       = 10
  enabled          = true

  # Optional: Configure how Lambda handles failures
  function_response_types = ["ReportBatchItemFailures"]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "generator_logs" {
  name              = "/aws/lambda/${aws_lambda_function.generator.function_name}"
  retention_in_days = 7
}

