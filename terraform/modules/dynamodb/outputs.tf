output "cheatsheets_table_name" {
  description = "Name of the cheatsheets DynamoDB table"
  value       = aws_dynamodb_table.cheatsheets.name
}

output "cheatsheets_table_arn" {
  description = "ARN of the cheatsheets DynamoDB table"
  value       = aws_dynamodb_table.cheatsheets.arn
}

output "shares_table_name" {
  description = "Name of the shares DynamoDB table"
  value       = aws_dynamodb_table.shares.name
}

output "shares_table_arn" {
  description = "ARN of the shares DynamoDB table"
  value       = aws_dynamodb_table.shares.arn
}

output "dynamodb_policy_arn" {
  description = "ARN of the DynamoDB IAM policy"
  value       = aws_iam_policy.dynamodb_policy.arn
}

