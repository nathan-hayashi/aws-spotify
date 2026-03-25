---
title: "AWS Spotify Project — Portfolio Proof of Work"
subtitle: "Complete Build Log, Debugging Journal, and Evidence Map"
author: "Nathan Lim"
date: "March 2026"
geometry: "margin=1in"
fontsize: 11pt
mainfont: "DejaVu Sans"
monofont: "DejaVu Sans Mono"
linkcolor: blue
urlcolor: blue
toc: true
toc-depth: 3
numbersections: true
header-includes:
  - \usepackage{fancyhdr}
  - \pagestyle{fancy}
  - \fancyhead[L]{AWS Spotify — Proof of Work}
  - \fancyhead[R]{Nathan Lim}
  - \fancyfoot[C]{\thepage}
---

\newpage

# Project Summary

This document is a structured proof-of-work log for the AWS Spotify portfolio project. It maps every action taken — from environment setup through live deployment — with terminal evidence, debugging notes, and code references. It is designed to be reviewed by hiring managers, interviewers, or technical evaluators who want to verify that this project was hand-built, not generated and forgotten.

## What Was Built

A microscaled Spotify-inspired architecture deployed on AWS, including:

- A custom VPC with public subnet, internet gateway, and security group rules
- An EC2 t3.micro instance running Node.js 22 and PostgreSQL 16
- Two S3 buckets (audio storage + frontend hosting) with encryption, versioning, lifecycle policies, and bucket policies
- A CloudFront CDN with dual origins (S3 for frontend, EC2 for API)
- AWS Cognito user pool with two app clients (public SPA + confidential server)
- CloudWatch billing alarms ($10/$20 thresholds), CPU monitoring, SNS alerting
- A REST API serving 28 songs with presigned S3 URL generation
- A React SPA frontend with live search and audio player UI
- 5 IAM groups, 3 custom IAM policies, 1 EC2 instance role with permission boundary
- CloudTrail (multi-region, log validation), GuardDuty, IAM Access Analyzer, AWS Config (4 rules)
- 2 supplementary CloudFormation templates with Terraform comparison docs
- A simulated postmortem incident report (S3 misconfiguration scenario)
- A full GRC document mapping to NIST 800-53 and CIS AWS Foundations Benchmark v3.0

## Tools Used

| Tool | Version | Purpose |
|------|---------|---------|
| WSL2 (Ubuntu 24.04) | Kernel 5.15 | Primary CLI environment |
| Terraform | v1.14.7 | Infrastructure as Code |
| AWS CLI | v2.x | AWS resource management |
| Node.js | v22.22.1 | API server runtime |
| PostgreSQL | 16.12 | Relational database |
| Vite + React | 6.x + 19.x | Frontend build toolchain |
| Git | 2.43.x | Version control |
| VS Code + WSL extension | Latest | IDE |
| Claude Code | Latest | AI-assisted code generation |

## Live Infrastructure

| Resource | Identifier | Region |
|----------|-----------|--------|
| VPC | vpc-00735e60db61b77ca | us-east-1 |
| Subnet | subnet-0d8044e9a91c9f080 | us-east-1a |
| Security Group | sg-0b9bd49198b4d1135 | us-east-1 |
| EC2 Instance | i-0c94b3606f81af2f1 | us-east-1 |
| Elastic IP | eipalloc-08d5d9dd38ba9ccad (34.195.227.70) | us-east-1 |
| S3 Audio | spotify-audio-037336516853 | us-east-1 |
| S3 Frontend | spotify-frontend-037336516853 | us-east-1 |
| CloudFront | E2LBAGJGWV1RLK (d24l2jal5wti3z.cloudfront.net) | Global |
| Cognito User Pool | us-east-1_xxxxx | us-east-1 |
| CloudTrail | spotify-audit-trail | Multi-region |

\newpage

# Build Timeline — Phase-by-Phase Action Log

## Phase 1: Environment Setup

**Date:** March 21-22, 2026

### Actions Taken

1. **WSL2 Ubuntu updated** — `sudo apt update && sudo apt upgrade -y`
2. **Terraform installed** via HashiCorp APT repository (v1.14.7)
3. **AWS CLI v2 installed** via official zip installer
4. **Node.js 22 LTS installed** via NodeSource
5. **SSH key pair generated** — Ed25519 for EC2 access
6. **Git configured** — user.name, user.email, default branch main
7. **GitHub repo created** — `aws-spotify` (public)
8. **VS Code configured** — WSL extension, Terraform extension, AWS Toolkit
9. **Claude Code installed** — for AI-assisted generation

### Debugging During This Phase

**Issue #1: SSH Key Generation Path** — Running `ssh-keygen -f C:\dev\aws-spotify` in WSL created a file named `Cdevaws-spotify` because backslashes were stripped. Fixed by using Linux-style paths.

**Issue #2: WSL Path Resolution** — Commands using `~/aws-spotify` failed because the project lives at `/mnt/c/dev/aws-spotify/`, not in the WSL home directory. This was the single most recurring issue in the entire project (8+ occurrences).

**Issue #10: SSH Key Permissions** — Files on `/mnt/c/` default to 0777 in WSL. SSH rejects keys with those permissions. Fixed by copying the key to `~/.ssh/id_ed25519_spotify` and chmod 600.

### Evidence

- WSL history lines 213-340
- debugging-log.txt entries 1, 2, 10, 11

## Phase 2: AWS Account Hardening and IAM

**Date:** March 22, 2026

### Actions Taken

1. **AWS CLI configured** with `spotify-admin` profile, us-east-1 region
2. **Verified identity** — `aws sts get-caller-identity` returned account 037336516853
3. **Created 5 IAM groups** via CLI:
   - SpotifyAdmins, SpotifyDevelopers, SpotifyDevOps, SpotifySecurityAuditors, SpotifyReadOnly
4. **Created 3 custom IAM policies** as JSON files in `iam-policies/`:
   - `developer-policy.json` — EC2 describe, S3 app bucket, CloudWatch logs, Cognito read
   - `security-auditor-policy.json` — Read-only IAM/CloudTrail/Config/GuardDuty with explicit deny on mutations
   - `permission-boundary.json` — Service ceiling (S3, EC2, Cognito, CloudFront, CloudWatch, Logs, Secrets Manager, KMS) with explicit deny on Organizations/Account actions
5. **Attached policies to groups** via CLI
6. **Created EC2 instance role** (`SpotifyEC2Role`) with:
   - Trust policy allowing `ec2.amazonaws.com` to assume
   - Permissions: S3 audio bucket, Secrets Manager, CloudWatch Logs/Metrics
   - Permission boundary attached
7. **Created instance profile** (`SpotifyEC2Profile`) and linked the role
8. **Enabled IAM Access Analyzer** — `spotify-access-analyzer`, type ACCOUNT

### Debugging During This Phase

**Issue #3: IAM ARN Formatting** — Forgot the double colon in `arn:aws:iam::<account>:policy/...`. IAM is a global service, so the region field is always empty (hence double colons).

**Issue #5: Permission Boundary Deletion** — Couldn't delete SpotifyPermissionBoundary because it was attached to SpotifyEC2Role as a boundary (not a regular policy attachment). Required `delete-role-permissions-boundary` instead of `detach-group-policy`.

### Evidence

- WSL history lines 340-850
- IAM policy JSON files in `iam-policies/`
- debugging-log.txt entries 3, 5

## Phase 3: Security Services

**Date:** March 22, 2026

### Actions Taken

1. **Created CloudTrail S3 bucket** — `spotify-cloudtrail-037336516853`
2. **Applied bucket policy** granting CloudTrail write access
3. **Created CloudTrail trail** — multi-region, log file validation enabled
4. **Started CloudTrail logging** — verified with `get-trail-status` (IsLogging: true)
5. **Enabled GuardDuty** — 15-minute finding publication frequency

### Debugging During This Phase

**Issue #4: S3 Bucket in us-east-1** — `--create-bucket-configuration LocationConstraint=us-east-1` fails because us-east-1 is the default. Must omit the flag entirely for us-east-1. Every other region requires it. AWS quirk worth memorizing.

### Evidence

- WSL history lines 630-850
- debugging-log.txt entry 4

## Phase 4: Terraform Infrastructure

**Date:** March 22-23, 2026

### Actions Taken

**VPC Module (11 resources):**

1. Created `terraform/modules/vpc/main.tf` — VPC, IGW, public subnet, route table, security group with 5 rules
2. Created `terraform/environments/dev/main.tf` — provider config, module calls
3. `terraform init` — downloaded AWS provider v5.100.0
4. `terraform plan` — 11 resources to create
5. `terraform apply` — all 11 created successfully

**EC2 Module (2 resources):**

1. Imported SSH public key to AWS — `aws ec2 import-key-pair`
2. Looked up latest Amazon Linux 2023 AMI
3. Created `terraform/modules/ec2/main.tf` — t3.micro, gp3 20GB encrypted, user_data script, EIP
4. `terraform plan` — 2 resources (instance + EIP)
5. `terraform apply` — instance running, SSH verified

**S3 Module (10 resources):**

1. Created `terraform/modules/s3/main.tf` — audio bucket (versioned, encrypted, CORS, lifecycle, bucket policy) + frontend bucket (static website hosting)
2. `terraform plan` — 10 resources, 1 warning
3. Fixed lifecycle rule missing `filter {}` block
4. `terraform apply` — all 10 created

**Monitoring Module (6 resources):**

1. Created `terraform/modules/monitoring/main.tf` — SNS topic, email subscription, AWS Budget ($10), billing alarms ($10/$20), CPU alarm
2. `terraform plan` — 6 resources
3. `terraform apply` — all 6 created, confirmed SNS subscription via email

**CloudFront Module (3 resources):**

1. Created `terraform/modules/cloudfront/main.tf` — distribution with S3 frontend origin (OAC) + EC2 API origin, SPA error routing
2. `terraform plan` — 3 resources
3. `terraform apply` — distribution deployed (5-10 minute propagation)

**Cognito Module (3 resources):**

1. Created `terraform/modules/cognito/main.tf` — user pool, frontend client (public, no secret), API client (with secret)
2. `terraform plan` — 3 resources
3. `terraform apply` — pool created with MFA optional, 12-char password policy

**Total Terraform-managed resources: 35**

### Debugging During This Phase

**Issue #6: Module Directory Creation** — `cat >` cannot create intermediate directories. Always `mkdir -p` first.

**Issue #7: Heredoc Failures** — Large heredocs with embedded EOF-like strings caused garbled output. Switched to `nano` for complex files.

**Issue #8: AMI ID Missing Prefix** — Pasted `0c421724a94bba6d6` instead of `ami-0c421724a94bba6d6`. AWS IDs always have prefixes.

**Issue #9: EC2 Key Pair Not Found** — SSH key existed locally but wasn't imported to AWS EC2. Two-step process: generate locally, import to AWS.

**Issue #12: Terraform Output Wrong Directory** — Ran `terraform output` from `terraform/` instead of `terraform/environments/dev/`. State file is in the environment directory.

**Issue #13: S3 Lifecycle Missing Filter** — AWS provider v5.x requires explicit `filter {}` even for "apply to all objects." Will become an error in future versions.

**Issue #14: sed Too Broad** — `sed 's/rule {/rule {\n    filter {}/'` matched ALL `rule {` blocks including encryption and CORS rules that don't support filter.

**Issue #15: CloudFront Origin Domain** — CloudFront requires a domain name for custom origins, not a bare IP address. Used EC2 public DNS instead.

### Evidence

- WSL history lines 850-2780
- All terraform module files in `terraform/modules/`
- `terraform state list` output: 35 resources
- debugging-log.txt entries 6-15, 22, 23

## Phase 5: Application Layer

**Date:** March 23, 2026

### Actions Taken

1. **PostgreSQL configured on EC2:**
   - Created `spotify` database
   - Installed `postgresql16-contrib` for citext extension
   - Created `spotify_app` user with limited privileges
   - Created all 6 tables matching the Brain Dump ERD schema
   - Created indexes on frequently queried columns
   - Configured `pg_hba.conf` for local TCP/md5 authentication
   - Seeded 28 songs by 28 artists (custom selection)

2. **Node.js API server built:**
   - Express.js with helmet, cors, morgan middleware
   - PostgreSQL connection pool (pg library)
   - JWT validation middleware using Cognito JWKS endpoint
   - S3 presigned URL generation via AWS SDK v3
   - Routes: `/api/health`, `/api/songs`, `/api/songs/:id`, `/api/artists/:id/songs`, `/api/playlists`, `/api/search`
   - Systemd service for persistent operation on port 3000

3. **API verified:**
   - Health check: `{"status":"healthy","database":"connected"}`
   - Song listing: 28 songs returned with pagination
   - Single song: metadata + presigned S3 URL (15-min expiry)
   - Search: ILIKE queries across songs and artists

### Debugging During This Phase

**Issue #16: Bash History Expansion** — Password `SpotifyDev2026!` in a heredoc caused bash to expand `!` as history reference. Used single quotes or files instead.

**Issue #17: citext Extension Missing** — `postgresql16-contrib` package required separately from base install.

**Issue #18: PostgreSQL sudo as postgres user** — Only `ec2-user` has passwordless sudo on Amazon Linux. Install packages as ec2-user, not from postgres session.

**Issue #19: pg_hba.conf Rule Ordering** — First match wins. Generic `host all all 127.0.0.1/32 ident` matched before specific `host spotify spotify_app 127.0.0.1/32 md5`. Moved specific rule above generic.

**Issue #20: TRUNCATE Permissions** — `TRUNCATE ... RESTART IDENTITY` requires table ownership, not just DML grants. Split workflow: truncate as postgres, insert as spotify_app.

**Issue #21: Running EC2 Commands Locally** — Ran `chown ec2-user:ec2-user` on WSL instead of EC2. ec2-user doesn't exist locally.

### Evidence

- WSL history lines 2780-3340
- API running at `http://34.195.227.70:3000/api/health`
- debugging-log.txt entries 16-21

## Phase 6: Frontend and Documentation

**Date:** March 24, 2026

### Actions Taken

1. **React SPA built:**
   - Vite build toolchain
   - Dark Spotify-themed UI with green accent
   - Live search against `/api/search`
   - Song list with artist names and durations
   - Audio player with play/pause (presigned URL streaming)
   - API health indicator badge

2. **Deployed to S3:**
   - `npm run build` produced `dist/` directory
   - `aws s3 sync dist/ s3://spotify-frontend-037336516853/ --delete`

3. **Port fix:**
   - API originally on port 80 (failed — requires root, ec2-user doesn't have it)
   - Changed to port 3000, updated CloudFront origin, added SG rule
   - Systemd service set to `Restart=always`

4. **CloudFormation templates created:**
   - `vpc-networking.yaml` — mirrors terraform/modules/vpc/
   - `s3-security.yaml` — mirrors terraform/modules/s3/
   - Comparison README documenting Terraform vs CF differences

5. **AWS Config set up:**
   - Configuration recorder + delivery channel
   - Updated CloudTrail S3 bucket policy to include Config service permissions
   - 4 rules: S3 encryption, EC2 in VPC, root MFA, root access key

6. **Documentation created:**
   - Simulated postmortem: INC-001 S3 public exposure
   - GRC document: governance, risk matrix, NIST 800-53 + CIS mappings
   - `CLAUDE.md` and `directory.md` for repo navigation

### Debugging During This Phase

**Issue #24: AWS Config Recorder Not Found** — Config rules require a running recorder. Setup order is strict: recorder, delivery channel, start recorder, then create rules.

**Issue #25: Heredoc EOF Indentation** — Terminal auto-indented the closing EOF marker. Heredoc closers must start at column 1. Switched to nano.

**Issue #26: AWS CLI Flag Split Across Lines** — `--policy` and `file://` on separate lines caused bash to interpret them as separate commands.

**Issue #27: Frontend Build** — Documented as a milestone, not a bug. CloudFront port change from 80 to 3000 was the significant operational fix.

### Evidence

- WSL history lines 3004-3929
- CloudFront URL: `https://d24l2jal5wti3z.cloudfront.net`
- debugging-log.txt entries 24-27

\newpage

# Debugging Summary — Recurring Themes

## Theme 1: Path Issues (Most Frequent — 8+ occurrences)

`~/` vs `/mnt/c/`, backslashes vs forward slashes, wrong key paths. Root cause: WSL bridges two filesystems. Fix: Always use absolute `/mnt/c/` paths.

## Theme 2: Order of Operations

pg_hba.conf rule ordering, granting permissions before using them, importing keys before referencing them in Terraform, Config recorder before rules. Root cause: Config files and cloud APIs process in sequence.

## Theme 3: Scope Confusion (Local vs Remote)

Running EC2 commands locally, running `terraform output` from wrong directory. Root cause: Multiple terminal sessions. Fix: Always check your prompt.

## Theme 4: String/Syntax Sensitivity

AMI ID prefix, IAM ARN double colons, bash `!` expansion, heredoc markers. Root cause: Cloud APIs and shell interpreters are literal. Fix: Copy-paste IDs, use files instead of heredocs.

## Theme 5: Permissions Model

Permission boundaries vs policies, table ownership vs grants, Linux file permissions on Windows FS, ec2-user vs postgres sudo access. Root cause: Multiple layered permission systems.

\newpage

# Terraform State — Full Resource Inventory

```
data.aws_caller_identity.current
module.ec2.aws_eip.api
module.ec2.aws_instance.api_server
module.s3.aws_s3_bucket.audio
module.s3.aws_s3_bucket.frontend
module.s3.aws_s3_bucket_cors_configuration.audio
module.s3.aws_s3_bucket_lifecycle_configuration.audio
module.s3.aws_s3_bucket_policy.audio
module.s3.aws_s3_bucket_public_access_block.audio
module.s3.aws_s3_bucket_public_access_block.frontend
module.s3.aws_s3_bucket_server_side_encryption_configuration.audio
module.s3.aws_s3_bucket_versioning.audio
module.s3.aws_s3_bucket_website_configuration.frontend
module.vpc.aws_internet_gateway.main
module.vpc.aws_route_table.public
module.vpc.aws_route_table_association.public
module.vpc.aws_security_group.api
module.vpc.aws_subnet.public
module.vpc.aws_vpc.main
module.vpc.aws_vpc_security_group_egress_rule.all_outbound
module.vpc.aws_vpc_security_group_ingress_rule.http
module.vpc.aws_vpc_security_group_ingress_rule.https
module.vpc.aws_vpc_security_group_ingress_rule.postgres
module.vpc.aws_vpc_security_group_ingress_rule.ssh
module.vpc.aws_vpc_security_group_ingress_rule.api
module.monitoring.aws_sns_topic.alerts
module.monitoring.aws_sns_topic_subscription.email
module.monitoring.aws_budgets_budget.monthly
module.monitoring.aws_cloudwatch_metric_alarm.billing_10
module.monitoring.aws_cloudwatch_metric_alarm.billing_20
module.monitoring.aws_cloudwatch_metric_alarm.cpu_high
module.cloudfront.aws_cloudfront_origin_access_control.frontend
module.cloudfront.aws_cloudfront_distribution.main
module.cloudfront.aws_s3_bucket_policy.frontend
module.cognito.aws_cognito_user_pool.main
module.cognito.aws_cognito_user_pool_client.frontend
module.cognito.aws_cognito_user_pool_client.api
```

\newpage

# Git Commit History

```
1. "file directories created"
   — Initial repo structure with all module directories

2. "feat: core infrastructure - VPC, EC2, S3, CloudFront, Cognito, monitoring, API server"
   — All Terraform modules deployed, API server running, 28 songs seeded

3. "feat: React frontend deployed to S3/CloudFront"
   — Spotify-themed UI, search, player, port 3000 fix

4. "docs: CloudFormation templates, postmortem simulation, GRC documentation"
   — CF templates, INC-001 postmortem, NIST/CIS compliance mapping

5. Additional commits for CLAUDE.md, directory.md, debugging-log.txt
```

\newpage

# AWS Console Screenshot Guide

This section maps exactly what to screenshot in the AWS console, which code produced it, and where to find that code in the repo. Each screenshot becomes a visual proof-of-work that links directly to a Terraform module or CLI command.

## VPC and Networking

| # | What to Screenshot | Where in AWS Console | Code That Created It |
|---|-------------------|---------------------|---------------------|
| 1 | VPC overview showing spotify-vpc (10.0.0.0/16) | VPC > Your VPCs > spotify-vpc | `terraform/modules/vpc/main.tf` lines 1-30 |
| 2 | Subnet showing 10.0.1.0/24 in us-east-1a | VPC > Subnets > spotify-public-subnet | `terraform/modules/vpc/main.tf` lines 38-50 |
| 3 | Route table with 0.0.0.0/0 to IGW | VPC > Route Tables > spotify-public-rt > Routes tab | `terraform/modules/vpc/main.tf` lines 52-66 |
| 4 | Security group inbound rules (SSH, HTTP, HTTPS, 3000, 5432) | VPC > Security Groups > spotify-api-sg > Inbound rules tab | `terraform/modules/vpc/main.tf` lines 68-120 |
| 5 | Security group outbound rules (all traffic) | VPC > Security Groups > spotify-api-sg > Outbound rules tab | `terraform/modules/vpc/main.tf` lines 122-128 |

## EC2

| # | What to Screenshot | Where in AWS Console | Code That Created It |
|---|-------------------|---------------------|---------------------|
| 6 | Instance details (t3.micro, running, VPC, SG, IAM role) | EC2 > Instances > spotify-api-server | `terraform/modules/ec2/main.tf` |
| 7 | Instance storage (20GB gp3 encrypted) | EC2 > Instances > spotify-api-server > Storage tab | `terraform/modules/ec2/main.tf` root_block_device block |
| 8 | Elastic IP association | EC2 > Elastic IPs > spotify-api-eip | `terraform/modules/ec2/main.tf` aws_eip resource |
| 9 | Key pairs showing aws-spotify-key | EC2 > Key Pairs | WSL: `aws ec2 import-key-pair` |
| 10 | Instance IAM role (SpotifyEC2Profile) | EC2 > Instances > spotify-api-server > Security tab | `iam-policies/ec2-trust-policy.json` + `ec2-role-policy.json` |

## S3

| # | What to Screenshot | Where in AWS Console | Code That Created It |
|---|-------------------|---------------------|---------------------|
| 11 | Audio bucket overview | S3 > spotify-audio-037336516853 | `terraform/modules/s3/main.tf` |
| 12 | Audio bucket versioning enabled | S3 > spotify-audio > Properties > Bucket Versioning | `terraform/modules/s3/main.tf` aws_s3_bucket_versioning |
| 13 | Audio bucket encryption (SSE-S3 AES-256) | S3 > spotify-audio > Properties > Default encryption | `terraform/modules/s3/main.tf` aws_s3_bucket_server_side_encryption_configuration |
| 14 | Audio bucket Block Public Access (all 4 enabled) | S3 > spotify-audio > Permissions > Block public access | `terraform/modules/s3/main.tf` aws_s3_bucket_public_access_block |
| 15 | Audio bucket policy (DenyUnencrypted + DenyInsecure) | S3 > spotify-audio > Permissions > Bucket policy | `terraform/modules/s3/main.tf` aws_s3_bucket_policy |
| 16 | Audio bucket CORS configuration | S3 > spotify-audio > Permissions > CORS | `terraform/modules/s3/main.tf` aws_s3_bucket_cors_configuration |
| 17 | Audio bucket lifecycle rules | S3 > spotify-audio > Management > Lifecycle rules | `terraform/modules/s3/main.tf` aws_s3_bucket_lifecycle_configuration |
| 18 | Frontend bucket with static website hosting | S3 > spotify-frontend > Properties > Static website hosting | `terraform/modules/s3/main.tf` aws_s3_bucket_website_configuration |
| 19 | Frontend bucket contents (index.html, assets/) | S3 > spotify-frontend > Objects tab | `frontend/dist/` deployed via `aws s3 sync` |

## CloudFront

| # | What to Screenshot | Where in AWS Console | Code That Created It |
|---|-------------------|---------------------|---------------------|
| 20 | Distribution overview (domain, status, price class) | CloudFront > Distributions > E2LBAGJGWV1RLK | `terraform/modules/cloudfront/main.tf` |
| 21 | Origins tab (S3 frontend + EC2 API) | CloudFront > Distribution > Origins tab | `terraform/modules/cloudfront/main.tf` origin blocks |
| 22 | Behaviors tab (default S3 + /api/* to EC2) | CloudFront > Distribution > Behaviors tab | `terraform/modules/cloudfront/main.tf` cache behaviors |
| 23 | Error pages (403/404 to index.html) | CloudFront > Distribution > Error pages tab | `terraform/modules/cloudfront/main.tf` custom_error_response |

## IAM

| # | What to Screenshot | Where in AWS Console | Code That Created It |
|---|-------------------|---------------------|---------------------|
| 24 | IAM Groups list (5 groups) | IAM > User groups | WSL: `aws iam create-group` commands |
| 25 | SpotifyDevelopers group attached policies | IAM > User groups > SpotifyDevelopers > Permissions | `iam-policies/developer-policy.json` |
| 26 | SpotifySecurityAuditors attached policies | IAM > User groups > SpotifySecurityAuditors > Permissions | `iam-policies/security-auditor-policy.json` |
| 27 | SpotifyEC2Role trust relationships | IAM > Roles > SpotifyEC2Role > Trust relationships | `iam-policies/ec2-trust-policy.json` |
| 28 | SpotifyEC2Role permissions policies | IAM > Roles > SpotifyEC2Role > Permissions | `iam-policies/ec2-role-policy.json` |
| 29 | SpotifyEC2Policy JSON document | IAM > Policies > SpotifyEC2Policy > JSON tab | `iam-policies/ec2-role-policy.json` |
| 30 | IAM Access Analyzer (findings or clean) | IAM > Access Analyzer > spotify-access-analyzer | WSL: `aws accessanalyzer create-analyzer` |

## Cognito

| # | What to Screenshot | Where in AWS Console | Code That Created It |
|---|-------------------|---------------------|---------------------|
| 31 | User pool overview | Cognito > User pools > spotify-users | `terraform/modules/cognito/main.tf` |
| 32 | Password policy (12 char, upper/lower/num/symbol) | Cognito > spotify-users > Sign-in experience > Password policy | `terraform/modules/cognito/main.tf` password_policy block |
| 33 | MFA configuration (optional, TOTP) | Cognito > spotify-users > Sign-in experience > MFA | `terraform/modules/cognito/main.tf` mfa_configuration |
| 34 | App clients (frontend + api) | Cognito > spotify-users > App integration > App clients | `terraform/modules/cognito/main.tf` client resources |

## Monitoring and Security

| # | What to Screenshot | Where in AWS Console | Code That Created It |
|---|-------------------|---------------------|---------------------|
| 35 | CloudWatch alarms (billing-10, billing-20, cpu-high) | CloudWatch > Alarms > All alarms | `terraform/modules/monitoring/main.tf` |
| 36 | AWS Budget ($10 monthly) | Billing > Budgets > spotify-monthly-budget | `terraform/modules/monitoring/main.tf` aws_budgets_budget |
| 37 | SNS topic and subscription | SNS > Topics > spotify-alerts | `terraform/modules/monitoring/main.tf` aws_sns_topic |
| 38 | CloudTrail trail details | CloudTrail > Trails > spotify-audit-trail | WSL: `aws cloudtrail create-trail` |
| 39 | GuardDuty findings (or clean dashboard) | GuardDuty > Findings | WSL: `aws guardduty create-detector` |
| 40 | AWS Config rules (4 rules, compliance status) | Config > Rules | WSL: `aws configservice put-config-rule` commands |

## Frontend Live Demo

| # | What to Screenshot | Where in Browser | Code That Created It |
|---|-------------------|-----------------|---------------------|
| 41 | Full page showing all 28 songs | `https://d24l2jal5wti3z.cloudfront.net` | `frontend/src/App.jsx` |
| 42 | Search results for "red" | Search bar with "red" typed | `frontend/src/App.jsx` search function |
| 43 | Song highlighted as playing | Click any song row | `frontend/src/App.jsx` playSong function |
| 44 | API health badge showing "API Connected" | Top-right corner of the page | `frontend/src/App.jsx` health check useEffect |

## API Responses (Terminal)

| # | What to Screenshot | Command | Code That Created It |
|---|-------------------|---------|---------------------|
| 45 | Health check JSON | `curl http://34.195.227.70:3000/api/health \| jq` | EC2: `/opt/spotify-api/server.js` health endpoint |
| 46 | Song list JSON (all 28) | `curl http://34.195.227.70:3000/api/songs \| jq` | EC2: `/opt/spotify-api/src/routes/songs.js` |
| 47 | Single song with presigned URL | `curl http://34.195.227.70:3000/api/songs/1 \| jq` | EC2: `/opt/spotify-api/src/routes/songs.js` + `src/services/s3.js` |
| 48 | Search results JSON | `curl "http://34.195.227.70:3000/api/search?q=red" \| jq` | EC2: `/opt/spotify-api/src/routes/search.js` |

## Terraform

| # | What to Screenshot | Command | Code Reference |
|---|-------------------|---------|---------------|
| 49 | `terraform state list` output (35+ resources) | Terminal in `terraform/environments/dev/` | All modules |
| 50 | `terraform plan` showing "No changes" (clean state) | `terraform plan` | All modules |

**Total screenshots: 50**

\newpage

# File Reference — Where Everything Lives

| File | Purpose | Phase Created |
|------|---------|---------------|
| `terraform/modules/vpc/main.tf` | VPC, subnet, IGW, route table, security group | Phase 4 |
| `terraform/modules/ec2/main.tf` | EC2 instance, EBS, EIP, user_data | Phase 4 |
| `terraform/modules/s3/main.tf` | Audio + frontend S3 buckets | Phase 4 |
| `terraform/modules/cloudfront/main.tf` | CDN distribution, OAC, behaviors | Phase 4 |
| `terraform/modules/cognito/main.tf` | User pool, app clients | Phase 4 |
| `terraform/modules/monitoring/main.tf` | SNS, budgets, alarms | Phase 4 |
| `terraform/environments/dev/main.tf` | Provider, module calls, outputs | Phase 4 |
| `iam-policies/*.json` | IAM policy documents (6 files) | Phase 2 |
| `frontend/src/App.jsx` | React SPA component | Phase 6 |
| `frontend/vite.config.js` | Vite build config | Phase 6 |
| `cloudformation/vpc-networking.yaml` | CF supplementary template | Phase 6 |
| `cloudformation/s3-security.yaml` | CF supplementary template | Phase 6 |
| `docs/postmortem/INC-001-s3-public-exposure.md` | Simulated incident report | Phase 6 |
| `docs/grc/governance-risk-compliance.md` | GRC documentation | Phase 6 |
| `debugging-log.txt` | 27 debugging entries | All phases |
| `wsl-history-full.txt` | 3929 lines of terminal history | All phases |
| `directory.md` | Full repo navigation map | Phase 6 |
| `CLAUDE.md` | Claude Code project context | Phase 6 |
