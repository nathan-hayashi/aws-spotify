# AWS-Spotify Project — Directory Navigation

> **Archive Notice:** This project's AWS infrastructure has been decommissioned. Resource identifiers shown below are historical references.

> This file maps every folder in the repository: what it is, why it exists, what it contains, how to use it, and where it is located. This file must be reviewed and updated whenever the project structure changes.

---

## Root: `/mnt/c/dev/aws-spotify/`

The project root. Contains top-level config files and all project subdirectories.

| File | Purpose |
|------|---------|
| `.gitignore` | Defines files excluded from git (SSH keys, .env, node_modules, Terraform state/vars) |
| `LICENSE` | Project license |
| `README.md` | Project overview and documentation |
| `CLAUDE.md` | Context file for Claude Code — project onboarding, conventions, rules |
| `debugging-log.txt` | Running log of all debugging actions, problems, solutions, and lessons learned |
| `wsl-history-full.txt` | Full WSL command history export — raw input/output reference |
| `directory.md` | This file. Navigation map of the entire project structure |

---

## `.github/workflows/`
**Location:** `/mnt/c/dev/aws-spotify/.github/workflows/`
**What:** GitHub Actions CI/CD workflow definitions.
**Why:** Automates testing, linting, and deployment pipelines triggered by git events.
**Contains:** Empty — workflows not yet configured.
**How to use:** Add `.yml` workflow files here to define CI/CD pipelines (e.g., `deploy.yml`, `test.yml`).

---

## `.vscode/`
**Location:** `/mnt/c/dev/aws-spotify/.vscode/`
**What:** VS Code workspace settings.
**Why:** Ensures consistent editor behavior (formatting, extensions, linting) for anyone working in this project.
**Contains:**
- `settings.json` — Editor configuration for this workspace.
**How to use:** Opens automatically when the project is opened in VS Code. Add recommended extensions in `extensions.json` if needed.

---

## `app/`
**Location:** `/mnt/c/dev/aws-spotify/app/`
**What:** Backend Node.js API server (Express).
**Why:** Serves the REST API for the Spotify clone — handles authentication, song/artist/playlist CRUD, and S3 presigned URL generation.
**Contains:**
- `src/middleware/` — Express middleware (JWT auth, error handling)
- `src/models/` — Database models and queries (PostgreSQL)
- `src/routes/` — API route handlers (/api/songs, /api/artists, /api/playlists, /api/auth)
- `src/services/` — Business logic layer (S3 service, Cognito service)
- `src/utils/` — Shared utilities (database connection, config)
- `tests/` — API test files
**How to use:** Deployed to the EC2 instance at `/opt/spotify-api`. Run locally with `npm start` or `node src/index.js`. Requires `.env` file with database and AWS credentials.
**Note:** Source files are currently empty — code is deployed directly on the EC2 instance.

---

## `cloudformation/`
**Location:** `/mnt/c/dev/aws-spotify/cloudformation/`
**What:** AWS CloudFormation templates — supplementary IaC examples (NOT deployed).
**Why:** Demonstrates the same infrastructure in CloudFormation for comparison with the Terraform modules. Shows proficiency in both IaC tools.
**Contains:**
- `vpc-networking.yaml` — VPC, subnet, IGW, route table, security group (mirrors terraform/modules/vpc/)
- `s3-security.yaml` — Audio S3 bucket with encryption, versioning, lifecycle, CORS, bucket policy (mirrors terraform/modules/s3/)
- `README.md` — Terraform vs CloudFormation comparison, validation/deployment instructions
**How to use:** Validate without deploying: `aws cloudformation validate-template --template-body file://vpc-networking.yaml`. These are reference only — Terraform manages the live infrastructure.

---

## `docs/`
**Location:** `/mnt/c/dev/aws-spotify/docs/`
**What:** Project documentation, architecture diagrams, incident reports, compliance docs.
**Why:** Central location for non-code documentation that supports operations, security, and development.
**Contains:**
- `diagrams/` — Architecture and flow diagrams (empty)
- `grc/governance-risk-compliance.md` — Governance structure, risk matrix, NIST 800-53 controls, CIS AWS Foundations mapping, security controls summary
- `postmortem/INC-001-s3-public-exposure.md` — Simulated incident report: S3 public access misconfiguration (timeline, root cause analysis, remediation, lessons learned)
- `runbook/AWS_Spotify_Runbook.pdf` — Operational runbook for the AWS infrastructure
**How to use:** Reference the runbook for operational procedures. GRC doc covers compliance mappings for interview discussion. Postmortem follows standard incident response format.

---

## `frontend/`
**Location:** `/mnt/c/dev/aws-spotify/frontend/`
**What:** React frontend application (SPA) built with Vite.
**Why:** The user-facing web app — music player UI with search, song listing, and audio playback.
**Contains:**
- `index.html` — Entry HTML file
- `vite.config.js` — Vite build configuration
- `package.json` — Dependencies (react, react-dom, vite)
- `src/main.jsx` — React entry point
- `src/App.jsx` — Main app component (search bar, song list, audio player, API health check)
- `public/` — Static assets
- `dist/` — Build output (deployed to S3)
**How to use:**
```bash
cd /mnt/c/dev/aws-spotify/frontend
npm run dev      # Local dev server
npm run build    # Build for production
aws s3 sync dist/ s3://spotify-frontend-<ACCOUNT_ID>/ --delete   # Deploy to S3
```
**Deployed at:** CloudFront distribution URL (via `terraform output cloudfront_url`)

---

## `iam-policies/`
**Location:** `/mnt/c/dev/aws-spotify/iam-policies/`
**What:** IAM policy JSON documents used for AWS CLI commands.
**Why:** These policies were created manually via AWS CLI before Terraform took over infrastructure management. They define access controls for IAM groups, roles, and permission boundaries.
**Contains:**
- `cloudtrail-bucket-policy.json` — S3 bucket policy allowing CloudTrail to write audit logs
- `developer-policy.json` — IAM policy for the SpotifyDevelopers group (EC2 describe, S3 app bucket, CloudWatch logs, Cognito read)
- `ec2-role-policy.json` — IAM policy for the SpotifyEC2Role (S3 audio bucket, Secrets Manager, CloudWatch)
- `ec2-trust-policy.json` — Trust policy allowing EC2 service to assume SpotifyEC2Role
- `permission-boundary.json` — Permission boundary limiting max permissions (region-locked to us-east-1, denies dangerous org/account actions)
- `security-auditor-policy.json` — IAM policy for SpotifySecurityAuditors group (read-only IAM, CloudTrail, Config, GuardDuty, Access Analyzer)
**How to use:** Referenced by AWS CLI commands like `aws iam create-policy --policy-document file://<path>`. These are the source-of-truth for policies created outside of Terraform.

---

## `scripts/`
**Location:** `/mnt/c/dev/aws-spotify/scripts/`
**What:** Utility and automation scripts.
**Why:** Placeholder for deployment scripts, database migrations, seed scripts, and operational tooling.
**Contains:** Empty.
**How to use:** Add shell scripts for repeatable tasks like deployment, database seeding, backup, etc.

---

## `ssh/`
**Location:** `/mnt/c/dev/aws-spotify/ssh/`
**What:** SSH key pair for EC2 access.
**Why:** Stores the Ed25519 key pair used to authenticate SSH connections to the Spotify API EC2 instance.
**Contains:**
- `id_ed25519` — Private key (NEVER commit or share)
- `id_ed25519.pub` — Public key (imported to AWS EC2 as `aws-spotify-key`)
**How to use:** This directory is gitignored. The private key on the Windows FS has 0777 permissions which SSH rejects. Use the copy at `~/.ssh/id_ed25519_spotify` (chmod 600) for SSH:
```bash
ssh -i ~/.ssh/id_ed25519_spotify ec2-user@<EC2_PUBLIC_IP>
```
**Important:** The AWS EC2 registered key name is `aws-spotify-key`. The local filename does not need to match.

---

## `terraform/`
**Location:** `/mnt/c/dev/aws-spotify/terraform/`
**What:** Root of all Terraform infrastructure-as-code.
**Why:** Manages AWS infrastructure declaratively — reproducible, version-controlled, and plannable before applying.

### `terraform/environments/`
Environment-specific Terraform configurations. Each environment is an independent Terraform workspace with its own state.

#### `terraform/environments/dev/`
**Location:** `/mnt/c/dev/aws-spotify/terraform/environments/dev/`
**What:** Development environment — the active deployment.
**Contains:**
- `main.tf` — Provider config (AWS, us-east-1, spotify-admin profile) and all module calls (VPC, EC2, S3, monitoring, CloudFront, Cognito) with outputs
- `terraform.tfvars` — Variable values (project_name, admin_ip, ami_id, alert_email). Gitignored.
- `terraform.tfstate` / `terraform.tfstate.backup` — Terraform state tracking deployed resources. Gitignored.
- `.terraform.lock.hcl` — Provider version lock file
- `tfplan` — Last saved execution plan
- `.terraform/` — Downloaded providers and module cache
**How to use:** All terraform commands must run from THIS directory:
```bash
cd /mnt/c/dev/aws-spotify/terraform/environments/dev
terraform init      # Initialize/update providers and modules
terraform plan -out=tfplan   # Preview changes
terraform apply "tfplan"     # Apply changes
terraform output <name>      # Get output values (e.g., ec2_public_ip)
```

#### `terraform/environments/prod/`
**Location:** `/mnt/c/dev/aws-spotify/terraform/environments/prod/`
**What:** Production environment placeholder.
**Contains:** Empty — not yet configured.
**How to use:** When ready, copy the dev structure and adjust variables for production settings.

### `terraform/modules/`
Reusable Terraform modules. Each module is self-contained with its own variables, resources, and outputs.

#### `terraform/modules/vpc/`
**Location:** `/mnt/c/dev/aws-spotify/terraform/modules/vpc/`
**What:** Virtual Private Cloud networking.
**Contains:** `main.tf` — VPC (10.0.0.0/16), internet gateway, public subnet (10.0.1.0/24 in us-east-1a), route table, security group with ingress rules (SSH from admin IP, HTTP/HTTPS from anywhere, port 3000 API server, PostgreSQL from VPC only), all outbound egress.
**Variables:** vpc_cidr, public_subnet_cidr, availability_zone, project_name, admin_ip
**Outputs:** vpc_id, public_subnet_id, api_security_group_id

#### `terraform/modules/ec2/`
**Location:** `/mnt/c/dev/aws-spotify/terraform/modules/ec2/`
**What:** EC2 instance for the API server.
**Contains:** `main.tf` — t3.micro instance with Amazon Linux 2023, 20GB encrypted gp3 EBS, Elastic IP, user_data script (installs Node.js 22, PostgreSQL 16, CloudWatch agent, ffmpeg), IAM instance profile (SpotifyEC2Profile).
**Variables:** ami_id, instance_type, subnet_id, security_group_id, key_name, project_name, iam_instance_profile
**Outputs:** instance_id, public_ip, private_ip, public_dns

#### `terraform/modules/s3/`
**Location:** `/mnt/c/dev/aws-spotify/terraform/modules/s3/`
**What:** S3 buckets for audio storage and frontend hosting.
**Contains:** `main.tf` — Two buckets:
  - `spotify-audio-<account_id>`: Versioned, SSE-AES256 encrypted, CORS configured, lifecycle rules (IA after 30d, expire after 90d), bucket policy enforcing encryption and HTTPS
  - `spotify-frontend-<account_id>`: Static website hosting (index.html), public access blocked (served via CloudFront OAC)
**Variables:** project_name, account_id
**Outputs:** audio_bucket_name, audio_bucket_arn, frontend_bucket_name, frontend_bucket_arn, frontend_bucket_regional_domain_name

#### `terraform/modules/cloudfront/`
**Location:** `/mnt/c/dev/aws-spotify/terraform/modules/cloudfront/`
**What:** CloudFront CDN distribution.
**Contains:** `main.tf` — Distribution with two origins:
  - S3 frontend (default, via OAC) with 24h cache TTL
  - EC2 API (/api/* path pattern, no caching) via public DNS
  - SPA routing (403/404 -> index.html), HTTPS redirect, PriceClass_100
  - S3 bucket policy granting CloudFront OAC read access
**Variables:** project_name, frontend_bucket_regional_domain_name, frontend_bucket_id, ec2_public_dns
**Outputs:** distribution_domain_name, distribution_id

#### `terraform/modules/cognito/`
**Location:** `/mnt/c/dev/aws-spotify/terraform/modules/cognito/`
**What:** AWS Cognito user authentication.
**Contains:** `main.tf` — User pool (email-based, 12-char password policy, optional MFA, AUDIT security mode), two app clients:
  - Frontend client (public SPA, no secret, SRP + password auth)
  - API client (server-side, with secret, admin auth)
  - 1h access/ID tokens, 30d refresh tokens
**Variables:** project_name
**Outputs:** user_pool_id, user_pool_arn, frontend_client_id, api_client_id, api_client_secret (sensitive), cognito_endpoint

#### `terraform/modules/monitoring/`
**Location:** `/mnt/c/dev/aws-spotify/terraform/modules/monitoring/`
**What:** CloudWatch alarms and billing alerts.
**Contains:** `main.tf` — SNS topic with email subscription, AWS Budget ($10/month with 80%/100%/150% notifications), CloudWatch billing alarms ($10 warning, $20 emergency), EC2 CPU alarm (>80% for 2 periods).
**Variables:** project_name, alert_email, ec2_instance_id
**Outputs:** sns_topic_arn

#### `terraform/modules/iam/`
**Location:** `/mnt/c/dev/aws-spotify/terraform/modules/iam/`
**What:** IAM resources managed by Terraform (placeholder).
**Contains:** Empty — IAM is currently managed via AWS CLI with policies in `iam-policies/`.
**How to use:** Future migration target for moving IAM management into Terraform.

---

## Infrastructure Summary (What's Deployed)

| AWS Service | Resource | Managed By |
|-------------|----------|------------|
| VPC | spotify-vpc (10.0.0.0/16) | Terraform |
| EC2 | spotify-api-server (t3.micro) | Terraform |
| EIP | spotify-api-eip (<REDACTED>) | Terraform |
| S3 | spotify-audio-<ACCOUNT_ID> | Terraform |
| S3 | spotify-frontend-<ACCOUNT_ID> | Terraform |
| CloudFront | spotify-cdn | Terraform |
| Cognito | spotify-users pool | Terraform |
| SNS | spotify-alerts topic | Terraform |
| CloudWatch | Billing + CPU alarms | Terraform |
| IAM Groups | SpotifyAdmins, Developers, DevOps, SecurityAuditors, ReadOnly | AWS CLI |
| IAM Role | SpotifyEC2Role + SpotifyEC2Profile | AWS CLI |
| CloudTrail | spotify-audit-trail | AWS CLI |
| GuardDuty | Detector (15-min publishing) | AWS CLI |
| AWS Config | 4 compliance rules (S3 encryption, EC2 in VPC, root MFA, root access key) | AWS CLI |
| S3 | spotify-cloudtrail-<ACCOUNT_ID> | AWS CLI |

---

## Quick Reference Commands

```bash
# SSH into EC2
ssh -i ~/.ssh/id_ed25519_spotify ec2-user@$(cd /mnt/c/dev/aws-spotify/terraform/environments/dev && terraform output -raw ec2_public_ip)

# Terraform commands (always from dev environment)
cd /mnt/c/dev/aws-spotify/terraform/environments/dev
terraform plan -out=tfplan
terraform apply "tfplan"
terraform output

# PostgreSQL (on EC2)
sudo -u postgres psql spotify
psql -h 127.0.0.1 -U spotify_app -d spotify
```
