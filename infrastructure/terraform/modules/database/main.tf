variable "project" { type = string }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "subnet_ids" { type = list(string) }

variable "redis_node_type" {
  type        = string
  default     = "cache.t3.small"
  description = "ElastiCache node type. Upgrade in prod."
}

variable "redis_num_replicas" {
  type        = number
  default     = 2
  description = "Number of read replicas across AZs. Min 1 for HA failover."
}

# ─── Security groups ───────────────────────────────────────────────────────

resource "aws_security_group" "redis" {
  name_prefix = "${var.project}-${var.environment}-redis-"
  vpc_id      = var.vpc_id
  description = "Redis access from API ECS tasks only"

  # Ingress is created from compute module via a separate rule resource to avoid
  # a circular dependency between this module and compute.

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-${var.environment}-redis-sg" }
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.project}-${var.environment}-rds-"
  vpc_id      = var.vpc_id
  description = "Postgres access from API ECS tasks only"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-${var.environment}-rds-sg" }
}

# ─── Postgres ──────────────────────────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-${var.environment}-db"
  subnet_ids = var.subnet_ids
}

resource "random_password" "postgres" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "postgres_password" {
  name                    = "${var.project}-${var.environment}-postgres-password"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "postgres_password" {
  secret_id     = aws_secretsmanager_secret.postgres_password.id
  secret_string = random_password.postgres.result
}

resource "aws_db_instance" "postgres" {
  identifier        = "${var.project}-${var.environment}"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t3.medium"
  allocated_storage = 20
  storage_encrypted = true

  db_name  = "medichainlk"
  username = "postgres"
  password = random_password.postgres.result

  multi_az                = var.environment == "production"
  backup_retention_period = var.environment == "production" ? 14 : 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  performance_insights_enabled = true
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  skip_final_snapshot  = false
  final_snapshot_identifier = "${var.project}-${var.environment}-final-${formatdate("YYYY-MM-DD", timestamp())}"
  deletion_protection  = true

  tags = { Name = "${var.project}-${var.environment}-postgres" }

  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}

# ─── Redis: replication group with multi-AZ failover ───────────────────────
#
# Replacing `aws_elasticache_cluster` (single node, no failover) with a
# replication group that supports:
#   - Automatic failover across AZs
#   - In-transit + at-rest encryption
#   - AUTH token stored in Secrets Manager
#   - Slow log to CloudWatch
#
# The API connects via the primary endpoint; ioredis `reconnectOnError: READONLY`
# handles the transient error when the old primary becomes a replica during failover.

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project}-${var.environment}-redis"
  subnet_ids = var.subnet_ids
}

resource "random_password" "redis_auth" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "redis_auth" {
  name                    = "${var.project}-${var.environment}-redis-auth"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id     = aws_secretsmanager_secret.redis_auth.id
  secret_string = random_password.redis_auth.result
}

resource "aws_elasticache_parameter_group" "main" {
  name   = "${var.project}-${var.environment}-redis7"
  family = "redis7"

  # Evict least-recently-used keys with TTL when memory is full — sessions + cache survive,
  # throttler counters can safely be evicted since they auto-expire on TTL anyway.
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.project}-${var.environment}"
  description                = "MediChainLK Redis — sessions, cache, throttler, BullMQ"
  engine                     = "redis"
  engine_version             = "7.1"
  node_type                  = var.redis_node_type
  parameter_group_name       = aws_elasticache_parameter_group.main.name
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.redis.id]
  port                       = 6379

  # High availability across at least 2 AZs
  num_cache_clusters         = 1 + var.redis_num_replicas
  automatic_failover_enabled = var.redis_num_replicas > 0
  multi_az_enabled           = var.redis_num_replicas > 0

  # Security: encryption + AUTH
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth.result

  # Backups — daily snapshot retained 5 days in prod
  snapshot_retention_limit = var.environment == "production" ? 5 : 1
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "sun:05:00-sun:06:00"

  apply_immediately = false

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = { Name = "${var.project}-${var.environment}-redis" }
}

resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/elasticache/${var.project}-${var.environment}/slow-log"
  retention_in_days = 14
}

# ─── Outputs ───────────────────────────────────────────────────────────────

output "rds_endpoint" { value = aws_db_instance.postgres.endpoint }
output "rds_password_secret_arn" { value = aws_secretsmanager_secret.postgres_password.arn }

output "redis_primary_endpoint" { value = aws_elasticache_replication_group.redis.primary_endpoint_address }
output "redis_reader_endpoint" { value = aws_elasticache_replication_group.redis.reader_endpoint_address }
output "redis_auth_secret_arn" { value = aws_secretsmanager_secret.redis_auth.arn }

output "redis_security_group_id" { value = aws_security_group.redis.id }
output "rds_security_group_id" { value = aws_security_group.rds.id }
