# Lambda function that tracks S3 upload/delete events and updates DynamoDB
resource "aws_lambda_function" "tracker" {
  filename         = data.archive_file.tracker_zip.output_path
  function_name    = "${var.app_name}-s3-tracker"
  role             = aws_iam_role.lambda_role.arn
  handler          = "tracker.handler"
  source_code_hash = data.archive_file.tracker_zip.output_base64sha256
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
data "archive_file" "tracker_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../generator/src"
  output_path = "${path.module}/tracker_function.zip"
  excludes    = ["__pycache__", "*.pyc", "*.pyo", ".pytest_cache", ".mypy_cache"]
}


resource "aws_s3_bucket_notification" "s3_to_sqs" {
  bucket = var.bucket_id

  lambda_function {
    lambda_function_arn = aws_lambda_function.tracker.arn
    events              = ["s3:ObjectCreated:*", ""]
  }

  depends_on = [aws_iam_role_policy.lambda_sqs_s3_dynamodb_policy]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.tracker.function_name}"
  retention_in_days = 7
}

