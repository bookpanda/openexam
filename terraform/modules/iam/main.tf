data "aws_caller_identity" "current" {}

resource "aws_iam_user" "user" {
  name = "${var.app_name}-user"
}

resource "aws_iam_policy_attachment" "s3_policy_attachment" {
  name       = "${var.app_name}-user-policy-attachment"
  policy_arn = var.s3_policy_arn
  users      = [aws_iam_user.user.name]
}

resource "aws_iam_access_key" "user_access_key" {
  user = aws_iam_user.user.name
}

# IAM Role for team members to access S3 and DynamoDB
resource "aws_iam_role" "app_service_role" {
  name = "${var.app_name}-team-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "role_s3_policy" {
  role       = aws_iam_role.app_service_role.name
  policy_arn = var.s3_policy_arn
}

resource "aws_iam_role_policy_attachment" "role_dynamodb_policy" {
  role       = aws_iam_role.app_service_role.name
  policy_arn = aws_iam_policy.dynamodb_policy.arn
}

resource "aws_iam_role_policy_attachment" "role_sqs_policy" {
  role       = aws_iam_role.app_service_role.name
  policy_arn = aws_iam_policy.sqs_policy.arn
}
