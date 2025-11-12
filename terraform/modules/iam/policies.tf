resource "aws_iam_policy" "sqs_policy" {
  name        = "${var.app_name}-SQSPermissions"
  description = "Permissions to use SQS queues for cheatsheet generation"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ]
        Resource = var.request_queue_arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ]
        Resource = var.response_queue_arn
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "sqs_policy_attachment" {
  name       = "${var.app_name}-sqs-policy-attachment"
  policy_arn = aws_iam_policy.sqs_policy.arn
  users      = [aws_iam_user.user.name]
  depends_on = [aws_iam_user.user]
}

resource "aws_iam_policy" "dynamodb_policy" {
  name        = "${var.app_name}-DynamoDBPermissions"
  description = "Permissions to access DynamoDB tables for file and share management"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:BatchGetItem",
          "dynamodb:Scan"
        ]
        Resource = [
          var.files_table_arn,
          "${var.files_table_arn}/index/*",
          var.shares_table_arn,
          "${var.shares_table_arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "dynamodb_policy_attachment" {
  name       = "${var.app_name}-dynamodb-policy-attachment"
  policy_arn = aws_iam_policy.dynamodb_policy.arn
  users      = [aws_iam_user.user.name]
  depends_on = [aws_iam_user.user]
}
