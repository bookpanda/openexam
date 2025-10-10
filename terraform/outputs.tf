
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

output "queue_name" {
  value = module.sqs.queue_name
}

output "queue_url" {
  value = module.sqs.queue_url
}

output "lambda_function_name" {
  value = module.lambda.lambda_function_name
}

output "lambda_function_arn" {
  value = module.lambda.lambda_function_arn
}
