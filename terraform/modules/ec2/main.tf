variable "ami_id" {
  description = "Amazon Linux 2023 AMI ID"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "subnet_id" {
  type = string
}

variable "security_group_id" {
  type = string
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
}

variable "project_name" {
  type = string
}

variable "iam_instance_profile" {
  description = "IAM instance profile name"
  type        = string
  default     = "SpotifyEC2Profile"
}

resource "aws_instance" "api_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]
  key_name               = var.key_name
  iam_instance_profile   = var.iam_instance_profile

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true

    tags = {
      Name = "${var.project_name}-api-ebs"
    }
  }

  user_data = <<-USERDATA
    #!/bin/bash
    set -e

    # Update system
    dnf update -y

    # Install Node.js 22 LTS
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
    dnf install -y nodejs

    # Install PostgreSQL 16
    dnf install -y postgresql16-server postgresql16
    postgresql-setup --initdb
    systemctl enable postgresql
    systemctl start postgresql

    # Install CloudWatch agent
    dnf install -y amazon-cloudwatch-agent

    # Install ffmpeg for audio metadata extraction
    dnf install -y ffmpeg

    # Create app directory
    mkdir -p /opt/spotify-api
    chown ec2-user:ec2-user /opt/spotify-api

    echo "User data script completed at $(date)" >> /var/log/user-data.log
  USERDATA

  tags = {
    Name = "${var.project_name}-api-server"
  }
}

resource "aws_eip" "api" {
  instance = aws_instance.api_server.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-api-eip"
  }
}

output "instance_id" {
  value = aws_instance.api_server.id
}

output "public_ip" {
  value = aws_eip.api.public_ip
}

output "private_ip" {
  value = aws_instance.api_server.private_ip
}
