output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.database.rds_endpoint
  sensitive   = true
}

output "rds_password_secret_arn" {
  description = "Secrets Manager ARN for RDS password"
  value       = module.database.rds_password_secret_arn
}

output "redis_primary_endpoint" {
  description = "ElastiCache Redis primary endpoint (writes + reads)"
  value       = module.database.redis_primary_endpoint
  sensitive   = true
}

output "redis_reader_endpoint" {
  description = "ElastiCache Redis reader endpoint (read-only traffic)"
  value       = module.database.redis_reader_endpoint
  sensitive   = true
}

output "redis_auth_secret_arn" {
  description = "Secrets Manager ARN for Redis AUTH token"
  value       = module.database.redis_auth_secret_arn
}

output "s3_bucket_name" {
  description = "S3 bucket name for prescription images"
  value       = module.storage.bucket_name
}

output "ecs_cluster_arn" {
  description = "ECS Fargate cluster ARN"
  value       = module.compute.cluster_arn
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name — point Route 53 here"
  value       = module.compute.alb_dns_name
}
