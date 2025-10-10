
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

module "lambda" {
  source      = "./modules/lambda"
  app_name    = var.app_name
  bucket_name = module.s3.bucket_name
  queue_arn   = module.sqs.queue_arn
}

module "iam" {
  source        = "./modules/iam"
  app_name      = var.app_name
  s3_policy_arn = module.s3.s3_policy_arn
}

