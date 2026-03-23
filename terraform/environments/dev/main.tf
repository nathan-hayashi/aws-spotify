terraform {
  required_version = ">= 1.14.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = "us-east-1"
  profile = "spotify-admin"

  default_tags {
    tags = {
      Project     = "spotify"
      Environment = "dev"
      ManagedBy   = "terraform"
    }
  }
}

variable "project_name" {
  type = string
}

variable "admin_ip" {
  type = string
}

module "vpc" {
  source = "../../modules/vpc"

  project_name = var.project_name
  admin_ip     = var.admin_ip
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "subnet_id" {
  value = module.vpc.public_subnet_id
}

output "security_group_id" {
  value = module.vpc.api_security_group_id
}

variable "ami_id" {
  type = string
}

module "ec2" {
  source = "../../modules/ec2"

  ami_id            = var.ami_id
  project_name      = var.project_name
  subnet_id         = module.vpc.public_subnet_id
  security_group_id = module.vpc.api_security_group_id
  key_name          = "aws-spotify-key"
}

output "ec2_public_ip" {
  value = module.ec2.public_ip
}

output "ec2_instance_id" {
  value = module.ec2.instance_id
}

data "aws_caller_identity" "current" {}

module "s3" {
  source = "../../modules/s3"

  project_name = var.project_name
  account_id   = data.aws_caller_identity.current.account_id
}

output "audio_bucket" {
  value = module.s3.audio_bucket_name
}

output "frontend_bucket" {
  value = module.s3.frontend_bucket_name
}

variable "alert_email" {
  type = string
}

module "monitoring" {
  source = "../../modules/monitoring"

  project_name    = var.project_name
  alert_email     = var.alert_email
  ec2_instance_id = module.ec2.instance_id
}

module "cloudfront" {
  source = "../../modules/cloudfront"

  project_name                         = var.project_name
  frontend_bucket_regional_domain_name = module.s3.frontend_bucket_regional_domain_name
  frontend_bucket_id                   = module.s3.frontend_bucket_name
  ec2_public_dns                       = module.ec2.public_dns
}

output "cloudfront_url" {
  value = "https://${module.cloudfront.distribution_domain_name}"
}

module "cognito" {
  source = "../../modules/cognito"

  project_name = var.project_name
}

output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}

output "cognito_frontend_client_id" {
  value = module.cognito.frontend_client_id
}

output "cognito_endpoint" {
  value = module.cognito.cognito_endpoint
}
