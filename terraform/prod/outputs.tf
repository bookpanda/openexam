
output "access_key_id" {
  value = module.iam.access_key_id
}

output "secret_access_key" {
  value     = module.iam.secret_access_key
  sensitive = true
}

output "region" {
  value = var.region
}

output "bucket_name" {
  value = module.s3.bucket_name
}

output "sqs_request_queue_url" {
  value = module.sqs.request_queue_url
}

output "sqs_response_queue_url" {
  value = module.sqs.response_queue_url
}

output "shares_table_name" {
  value = module.dynamodb.shares_table_name
}

output "dynamodb_policy_arn" {
  value = module.dynamodb.dynamodb_policy_arn
}
