output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.database.rds_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.database.redis_endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket name for prescription images"
  value       = module.storage.bucket_name
}

output "ecs_cluster_arn" {
  description = "ECS Fargate cluster ARN"
  value       = module.compute.cluster_arn
}
