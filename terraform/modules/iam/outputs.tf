output "access_key_id" {
  value = aws_iam_access_key.user_access_key.id
}

output "secret_access_key" {
  value = aws_iam_access_key.user_access_key.secret
}

output "team_role_arn" {
  description = "ARN of the team role with S3 and DynamoDB access"
  value       = aws_iam_role.app_service_role.arn
}

output "team_role_name" {
  description = "Name of the team role"
  value       = aws_iam_role.app_service_role.name
}
