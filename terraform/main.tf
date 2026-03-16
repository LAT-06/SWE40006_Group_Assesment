terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Fill in `bucket` and `region` here, or pass via -backend-config in CI
  backend "s3" {
    # bucket = "deployma-tf-state-YOURNAME"
    key = "deployma/terraform.tfstate"
    # region = "ap-southeast-2"
  }
}

provider "aws" {
  region = var.aws_region
}

module "backend_api" {
  source = "./modules/backend_api"

  project_name      = var.project_name
  supabase_url      = var.supabase_url
  supabase_anon_key = var.supabase_anon_key
  allowed_origins   = var.allowed_origins
  backend_zip_path  = "${path.module}/backend.zip"
}

module "frontend_cdn" {
  source = "./modules/frontend_cdn"

  project_name = var.project_name
}

# Preserve existing state addresses when moving from flat resources to modules.
# Run `terraform init` then `terraform plan` and Terraform will remap state
# without recreating these resources.
moved {
  from = aws_s3_bucket.lambda_packages
  to   = module.backend_api.aws_s3_bucket.lambda_packages
}

moved {
  from = aws_s3_bucket_versioning.lambda_packages
  to   = module.backend_api.aws_s3_bucket_versioning.lambda_packages
}

moved {
  from = aws_iam_role.lambda_exec
  to   = module.backend_api.aws_iam_role.lambda_exec
}

moved {
  from = aws_iam_role_policy_attachment.lambda_basic
  to   = module.backend_api.aws_iam_role_policy_attachment.lambda_basic
}

moved {
  from = aws_s3_object.lambda_package
  to   = module.backend_api.aws_s3_object.lambda_package
}

moved {
  from = aws_lambda_function.backend
  to   = module.backend_api.aws_lambda_function.backend
}

moved {
  from = aws_apigatewayv2_api.backend
  to   = module.backend_api.aws_apigatewayv2_api.backend
}

moved {
  from = aws_apigatewayv2_integration.backend
  to   = module.backend_api.aws_apigatewayv2_integration.backend
}

moved {
  from = aws_apigatewayv2_route.default
  to   = module.backend_api.aws_apigatewayv2_route.default
}

moved {
  from = aws_apigatewayv2_stage.default
  to   = module.backend_api.aws_apigatewayv2_stage.default
}

moved {
  from = aws_lambda_permission.apigw
  to   = module.backend_api.aws_lambda_permission.apigw
}

moved {
  from = aws_s3_bucket.frontend
  to   = module.frontend_cdn.aws_s3_bucket.frontend
}

moved {
  from = aws_s3_bucket_public_access_block.frontend
  to   = module.frontend_cdn.aws_s3_bucket_public_access_block.frontend
}

moved {
  from = aws_cloudfront_origin_access_control.frontend
  to   = module.frontend_cdn.aws_cloudfront_origin_access_control.frontend
}

moved {
  from = aws_cloudfront_distribution.frontend
  to   = module.frontend_cdn.aws_cloudfront_distribution.frontend
}

moved {
  from = data.aws_iam_policy_document.frontend_s3
  to   = module.frontend_cdn.data.aws_iam_policy_document.frontend_s3
}

moved {
  from = aws_s3_bucket_policy.frontend
  to   = module.frontend_cdn.aws_s3_bucket_policy.frontend
}
