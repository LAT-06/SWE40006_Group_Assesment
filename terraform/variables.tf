variable "project_name" {
  description = "Prefix applied to all AWS resource names"
  default     = "deployma"
}

variable "aws_region" {
  description = "AWS region to deploy into"
  default     = "ap-southeast-2"
}

variable "supabase_url" {
  description = "Supabase project URL (e.g. https://xxx.supabase.co)"
}

variable "supabase_anon_key" {
  description = "Supabase anon (public) key"
}

variable "allowed_origins" {
  description = "CORS allowed origins for the backend API (set to your CloudFront domain after first deploy)"
  default     = "*"
}
