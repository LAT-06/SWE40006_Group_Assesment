output "api_url" {
  description = "API Gateway HTTP endpoint — use as VITE_API_URL and add to GitHub secrets"
  value       = aws_apigatewayv2_api.backend.api_endpoint
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain — your frontend URL"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — needed for cache invalidation in CI"
  value       = aws_cloudfront_distribution.frontend.id
}

output "frontend_bucket" {
  description = "S3 bucket name for frontend assets — use as S3_BUCKET in GitHub secrets"
  value       = aws_s3_bucket.frontend.bucket
}
