variable "aws_region" {
  description = "AWS region — ap-south-1 (Mumbai) provides ~25-40ms latency from Colombo"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "environment must be production, staging, or development"
  }
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "medichainlk"
}
