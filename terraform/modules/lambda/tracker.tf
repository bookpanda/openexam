# Lambda function that tracks S3 upload/delete events and updates DynamoDB
# Note: Package must be built first using generator/build_lambda.sh
resource "aws_lambda_function" "tracker" {
  filename         = "${path.module}/tracker_function.zip"
  function_name    = "${var.app_name}-s3-tracker"
  role             = aws_iam_role.lambda_role.arn
  handler          = "tracker.handler"
  source_code_hash = filebase64sha256("${path.module}/tracker_function.zip")
  runtime          = "python3.12"
  timeout          = 60
  memory_size      = 256

  environment {
    variables = {
      BUCKET_NAME       = var.bucket_name
      FILES_TABLE_NAME  = var.files_table_name
      SHARES_TABLE_NAME = var.shares_table_name
    }
  }
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

