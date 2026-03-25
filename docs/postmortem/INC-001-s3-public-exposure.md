# Incident Report: SPOTIFY-INC-001

## S3 Bucket Public Access Configuration Removed

| Field | Details |
|-------|---------|
| Incident ID | SPOTIFY-INC-001 |
| Severity | P1 (Critical) |
| Status | Resolved |
| Duration | 2 hours 15 minutes |
| Impact | Audio bucket temporarily lost Block Public Access settings |
| Root Cause | Terraform misconfiguration — resource deleted from .tf file |
| Date | 2026-03-24 (simulated) |

## Summary

During a routine Terraform update to add CORS configuration to the audio S3 bucket, the `aws_s3_bucket_public_access_block` resource was accidentally removed from the Terraform configuration file. On the next `terraform apply`, Terraform detected the resource was no longer in the desired state and destroyed the corresponding AWS resource. This left the audio bucket without Block Public Access protections for approximately 2 hours.

## Timeline (UTC)

| Time | Event |
|------|-------|
| 14:00 | Engineer pushes Terraform change to modify CORS settings on audio bucket |
| 14:02 | `terraform apply` runs — plan shows 1 create (CORS), 1 destroy (public access block). Engineer approves without reading the destroy line. |
| 14:02 | `aws_s3_bucket_public_access_block.audio` is destroyed in AWS |
| 14:05 | AWS Config rule `s3-bucket-server-side-encryption-enabled` evaluates — COMPLIANT (encryption is separate from public access) |
| 14:15 | GuardDuty detects unusual S3:GetObject patterns from IP addresses outside the AWS account |
| 14:30 | CloudTrail log shows `DeletePublicAccessBlock` API call by the Terraform IAM role |
| 14:45 | Alert reaches on-call engineer via SNS email notification |
| 15:00 | Engineer reviews Terraform state, identifies the missing resource, re-adds it to the .tf file |
| 15:05 | `terraform apply` restores Block Public Access on the audio bucket |
| 16:15 | Incident review completed, preventive measures documented |

## Root Cause Analysis

This is NOT a Terraform bug. Terraform did exactly what it was told — the resource was removed from the configuration, so Terraform removed it from AWS to match the desired state. This is correct infrastructure-as-code behavior.

The root cause is a **process failure** at two levels:

1. **No peer review of the Terraform plan.** The `terraform plan` output clearly showed `aws_s3_bucket_public_access_block.audio will be destroyed` in red text. The engineer approved without reading it.

2. **No automated plan validation in CI/CD.** There was no GitHub Actions check that would flag destructive changes to security-critical resources.

### Why the impact was limited

Defense-in-depth controls limited the blast radius:

- The S3 bucket policy with `DenyInsecureTransport` was still in place — blocking HTTP access
- The bucket had no public ACLs — removing Block Public Access doesn't grant public access, it only removes the guardrail that prevents it
- Presigned URLs are still required to access objects — no anonymous read was possible
- GuardDuty detected the anomalous access pattern within 15 minutes

## Actual Data Exposure

**None.** Removing Block Public Access is a necessary but not sufficient condition for public exposure. The bucket policy and lack of public ACLs meant objects remained private. However, the window of vulnerability was real — a single bucket policy misconfiguration during this period could have exposed all audio files.

## Remediation Actions

### Immediate (completed during incident)

1. Re-added `aws_s3_bucket_public_access_block.audio` to Terraform config
2. Ran `terraform apply` to restore the resource
3. Verified Block Public Access settings via console

### Short-term (completed within 48 hours)

1. Added `lifecycle { prevent_destroy = true }` to all security-critical Terraform resources:
   - `aws_s3_bucket_public_access_block.audio`
   - `aws_s3_bucket_policy.audio`
   - `aws_s3_bucket_server_side_encryption_configuration.audio`

2. Added AWS Config rule `s3-bucket-level-public-access-prohibited` to detect public access changes

### Long-term (planned)

1. Implement GitHub Actions workflow that runs `terraform plan` on every PR and requires manual approval for any `destroy` actions
2. Add Open Policy Agent (OPA) or Sentinel policy checks to block plans that destroy security resources
3. Enable S3 Object Lock on the audio bucket for compliance

## Lessons Learned

| Lesson | Action |
|--------|--------|
| Always read the full `terraform plan` output, especially destroy lines | Add to team onboarding documentation |
| Defense-in-depth works — multiple layers prevented actual exposure | Continue layered security approach |
| GuardDuty detection was fast (15 min) but notification was slow (30 min) | Reduce SNS alert threshold |
| `prevent_destroy` lifecycle should be default on security resources | Update Terraform module templates |

## Metrics

- **Time to detect:** 15 minutes (GuardDuty)
- **Time to notify:** 45 minutes (GuardDuty → CloudTrail correlation → SNS)
- **Time to remediate:** 20 minutes (identify cause + apply fix)
- **Total incident duration:** 2 hours 15 minutes
- **Data exposed:** None
- **Users impacted:** None
