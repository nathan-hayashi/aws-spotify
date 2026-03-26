# AWS-Spotify

Spotify clone deployed on AWS (archived). Node.js API on EC2, PostgreSQL database, S3 audio storage, CloudFront CDN, Cognito auth. Infrastructure managed by Terraform. All AWS resources have been decommissioned.

## Project Structure

- `terraform/environments/dev/` — Terraform workspace (infrastructure decommissioned)
- `terraform/modules/` — Reusable modules: vpc, ec2, s3, cloudfront, cognito, monitoring
- `iam-policies/` — IAM policy JSONs applied via AWS CLI (not Terraform-managed)
- `frontend/` — React SPA (Vite, deployed to S3 via CloudFront)
- `docs/runbook/` — Operational runbook
- `docs/grc/` — Governance, Risk, Compliance documentation
- `docs/postmortem/` — Incident report
- `docs/diagrams/` — AWS console screenshots
- `cloudformation/` — Supplementary CF templates (Terraform comparison)

See `directory.md` for full directory map with details on every folder.

## Key Files

- `directory.md` — Navigation map of the repo. Update this after any structural change.

## Working Conventions

- All Terraform commands run from `terraform/environments/dev/`
- AWS region: us-east-1, profile: spotify-admin
- Paths: Always use `/mnt/c/dev/aws-spotify/`, never `~/aws-spotify`

## Do Not

- Add Co-Authored-By lines to commits
- Commit files in ssh/, .env, *.tfvars, or *.tfstate
