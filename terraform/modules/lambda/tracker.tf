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
      BUCKET_NAME            = var.bucket_name
      SLIDES_TABLE_NAME      = var.slides_table_name
      CHEATSHEETS_TABLE_NAME = var.cheatsheets_table_name
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

# Lambda permission to allow S3 to invoke the function
resource "aws_lambda_permission" "allow_s3_invoke" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tracker.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = "arn:aws:s3:::${var.bucket_name}"
}

resource "aws_s3_bucket_notification" "s3_to_lambda_tracker" {
  bucket = var.bucket_id

  lambda_function {
    lambda_function_arn = aws_lambda_function.tracker.arn
    events              = ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]
  }

  depends_on = [aws_lambda_permission.allow_s3_invoke]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "tracker_logs" {
  name              = "/aws/lambda/${aws_lambda_function.tracker.function_name}"
  retention_in_days = 7
}

