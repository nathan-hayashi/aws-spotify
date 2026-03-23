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
