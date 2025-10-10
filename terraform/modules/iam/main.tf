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
