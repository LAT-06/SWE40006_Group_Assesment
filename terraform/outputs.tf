output "api_url" {
  description = "API Gateway HTTP endpoint — use as VITE_API_URL and add to GitHub secrets"
  value       = module.backend_api.api_url
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain — your frontend URL"
  value       = module.frontend_cdn.cloudfront_domain
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — needed for cache invalidation in CI"
  value       = module.frontend_cdn.cloudfront_distribution_id
}

output "frontend_bucket" {
  description = "S3 bucket name for frontend assets — use as S3_BUCKET in GitHub secrets"
  value       = module.frontend_cdn.frontend_bucket
}
