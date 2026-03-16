variable "project_name" {
  description = "Prefix applied to all AWS resource names"
  type        = string
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
}

variable "supabase_anon_key" {
  description = "Supabase anon (public) key"
  type        = string
}

variable "allowed_origins" {
  description = "CORS allowed origins"
  type        = string
}

variable "backend_zip_path" {
  description = "Absolute path to backend.zip built before terraform apply"
  type        = string
}
