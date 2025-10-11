
module "s3" {
  source   = "./modules/s3"
  app_name = var.app_name
}

module "sqs" {
  source      = "./modules/sqs"
  app_name    = var.app_name
  bucket_name = module.s3.bucket_name
  bucket_id   = module.s3.bucket_id
}

module "dynamodb" {
  source   = "./modules/dynamodb"
  app_name = var.app_name
}

module "lambda" {
  source             = "./modules/lambda"
  region             = var.region
  app_name           = var.app_name
  bucket_name        = module.s3.bucket_name
  bucket_id          = module.s3.bucket_id
  request_queue_arn  = module.sqs.request_queue_arn
  response_queue_arn = module.sqs.response_queue_arn
  response_queue_url = module.sqs.response_queue_url
  files_table_name   = module.dynamodb.files_table_name
  files_table_arn    = module.dynamodb.files_table_arn
  shares_table_name  = module.dynamodb.shares_table_name
  shares_table_arn   = module.dynamodb.shares_table_arn
}

module "iam" {
  source        = "./modules/iam"
  app_name      = var.app_name
  s3_policy_arn = module.s3.s3_policy_arn
}

