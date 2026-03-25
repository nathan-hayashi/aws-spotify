# AWS-Spotify

Spotify clone deployed on AWS. Node.js API on EC2, PostgreSQL database, S3 audio storage, CloudFront CDN, Cognito auth. Infrastructure managed by Terraform.

## Project Structure

- `terraform/environments/dev/` — Active Terraform workspace (run all tf commands here)
- `terraform/modules/` — Reusable modules: vpc, ec2, s3, cloudfront, cognito, monitoring
- `iam-policies/` — IAM policy JSONs applied via AWS CLI (not Terraform-managed)
- `app/` — Node.js Express API (deployed to EC2 at /opt/spotify-api)
- `frontend/` — React SPA (deployed to S3, served via CloudFront)
- `ssh/` — Gitignored. Ed25519 key pair for EC2 access
- `docs/runbook/` — Operational runbook PDF

See `directory.md` for full directory map with details on every folder.

## Key Files

- `debugging-log.txt` — Running log of all problems, solutions, and lessons learned. Append to this after resolving any issue.
- `directory.md` — Navigation map of the repo. Update this after any structural change.

## Working Conventions

- All Terraform commands run from `terraform/environments/dev/`
- AWS region: us-east-1, profile: spotify-admin
- SSH to EC2: `ssh -i ~/.ssh/id_ed25519_spotify ec2-user@<IP>`
- PostgreSQL app user: spotify_app (password auth via pg_hba.conf, md5)
- Paths: Always use `/mnt/c/dev/aws-spotify/`, never `~/aws-spotify`

## Do Not

- Add Co-Authored-By lines to commits
- Commit files in ssh/, .env, *.tfvars, or *.tfstate
