variable "project" { type = string }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "subnet_ids" { type = list(string) } # private subnets for ECS tasks
variable "public_subnet_ids" {
  type        = list(string)
  default     = []
  description = "Public subnets for the ALB"
}
variable "redis_security_group_id" {
  type    = string
  default = ""
}
variable "rds_security_group_id" {
  type    = string
  default = ""
}
variable "certificate_arn" {
  type        = string
  default     = ""
  description = "ACM cert ARN for HTTPS listener. If empty, only HTTP is enabled."
}

# ─── ECS cluster ───────────────────────────────────────────────────────────

resource "aws_ecs_cluster" "main" {
  name = "${var.project}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_cluster_capacity_providers" "fargate" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  # Use on-demand Fargate for baseline, Spot for burst capacity (≥ 70% cheaper,
  # with the trade-off of occasional interruptions — safe for stateless API
  # because sessions live in Redis and requests drain on deregistration).
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 2
  }
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 3
  }
}

# ─── ALB + security groups ─────────────────────────────────────────────────

resource "aws_security_group" "alb" {
  name_prefix = "${var.project}-${var.environment}-alb-"
  vpc_id      = var.vpc_id
  description = "Public ALB — 80/443 from internet"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-${var.environment}-alb-sg" }
}

resource "aws_security_group" "api" {
  name_prefix = "${var.project}-${var.environment}-api-"
  vpc_id      = var.vpc_id
  description = "API ECS tasks — ingress from ALB only"

  ingress {
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "API port from ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-${var.environment}-api-sg" }
}

# Allow API tasks to reach Redis + RDS (rules live here to break the circular
# dependency between the compute and database modules).
resource "aws_security_group_rule" "api_to_redis" {
  count                    = var.redis_security_group_id == "" ? 0 : 1
  type                     = "ingress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  security_group_id        = var.redis_security_group_id
  source_security_group_id = aws_security_group.api.id
  description              = "API → Redis"
}

resource "aws_security_group_rule" "api_to_rds" {
  count                    = var.rds_security_group_id == "" ? 0 : 1
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = var.rds_security_group_id
  source_security_group_id = aws_security_group.api.id
  description              = "API → Postgres"
}

resource "aws_lb" "main" {
  name               = "${var.project}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = length(var.public_subnet_ids) > 0 ? var.public_subnet_ids : var.subnet_ids

  idle_timeout                     = 60
  enable_cross_zone_load_balancing = true
  enable_http2                     = true
  drop_invalid_header_fields       = true
  enable_deletion_protection       = var.environment == "production"

  tags = { Name = "${var.project}-${var.environment}-alb" }
}

resource "aws_lb_target_group" "api" {
  name        = "${var.project}-${var.environment}-api"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  # Drain time: ALB stops sending new requests and waits up to this many seconds
  # for in-flight ones to finish. Must be ≥ longest request timeout (we set 30s).
  deregistration_delay = 30

  # Round-robin across tasks. No stickiness — state lives in Redis, so any instance
  # can handle any request. Stickiness would cause hotspots and slower failovers.
  load_balancing_algorithm_type = "round_robin"

  health_check {
    path                = "/health/ready"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = { Name = "${var.project}-${var.environment}-api-tg" }
}

# HTTP listener — always redirect to HTTPS if cert is configured
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = var.certificate_arn == "" ? "forward" : "redirect"

    dynamic "redirect" {
      for_each = var.certificate_arn == "" ? [] : [1]
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    target_group_arn = var.certificate_arn == "" ? aws_lb_target_group.api.arn : null
  }
}

resource "aws_lb_listener" "https" {
  count             = var.certificate_arn == "" ? 0 : 1
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# ─── Autoscaling ───────────────────────────────────────────────────────────
# Scale horizontally on CPU. Min 2 tasks across 2 AZs for HA.

variable "api_service_name" {
  type    = string
  default = ""
}

resource "aws_appautoscaling_target" "api" {
  count              = var.api_service_name == "" ? 0 : 1
  min_capacity       = 2
  max_capacity       = 20
  resource_id        = "service/${aws_ecs_cluster.main.name}/${var.api_service_name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_cpu" {
  count              = var.api_service_name == "" ? 0 : 1
  name               = "${var.project}-${var.environment}-api-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api[0].resource_id
  scalable_dimension = aws_appautoscaling_target.api[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.api[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 60.0
    scale_in_cooldown  = 300 # wait 5m before scaling in (avoid flapping)
    scale_out_cooldown = 60  # scale out fast on traffic spikes
  }
}

resource "aws_appautoscaling_policy" "api_request_count" {
  count              = var.api_service_name == "" ? 0 : 1
  name               = "${var.project}-${var.environment}-api-req"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api[0].resource_id
  scalable_dimension = aws_appautoscaling_target.api[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.api[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.api.arn_suffix}"
    }
    target_value       = 1000.0 # ~1000 req/min per task
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# ─── Outputs ───────────────────────────────────────────────────────────────

output "cluster_arn"       { value = aws_ecs_cluster.main.arn }
output "cluster_name"      { value = aws_ecs_cluster.main.name }
output "alb_dns_name"      { value = aws_lb.main.dns_name }
output "alb_zone_id"       { value = aws_lb.main.zone_id }
output "target_group_arn"  { value = aws_lb_target_group.api.arn }
output "api_security_group_id" { value = aws_security_group.api.id }
