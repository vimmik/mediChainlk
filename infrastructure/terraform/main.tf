terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment to use S3 remote state
  # backend "s3" {
  #   bucket = "medichainlk-terraform-state"
  #   key    = "terraform.tfstate"
  #   region = "ap-south-1"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "medichainlk"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

module "networking" {
  source      = "./modules/networking"
  project     = var.project_name
  environment = var.environment
}

module "database" {
  source      = "./modules/database"
  project     = var.project_name
  environment = var.environment
  vpc_id      = module.networking.vpc_id
  subnet_ids  = module.networking.private_subnet_ids
}

module "compute" {
  source      = "./modules/compute"
  project     = var.project_name
  environment = var.environment
  vpc_id      = module.networking.vpc_id
  subnet_ids  = module.networking.private_subnet_ids
  public_subnet_ids       = module.networking.public_subnet_ids
  redis_security_group_id = module.database.redis_security_group_id
  rds_security_group_id   = module.database.rds_security_group_id
}

module "storage" {
  source      = "./modules/storage"
  project     = var.project_name
  environment = var.environment
}
