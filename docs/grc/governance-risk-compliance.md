# Governance, Risk, and Compliance — Spotify AWS Project

## 1. Governance Structure

### Change Management

All infrastructure changes follow this process:

1. Engineer creates a feature branch in Git
2. Terraform configuration changes are committed
3. `terraform plan` output is reviewed
4. Pull request is opened for peer review
5. After approval, `terraform apply` is executed
6. Changes are verified in the AWS console
7. Branch is merged to `main`

**Evidence:** Git commit history, Terraform state file versions

### Access Control Matrix

| Role | AWS Console | Terraform Apply | EC2 SSH | S3 Read | S3 Write | IAM Modify |
|------|------------|----------------|---------|---------|----------|------------|
| Admin | Full | Yes | Yes | Yes | Yes | Yes |
| Developer | Read-only (us-east-1) | No | No | Yes | Yes | No |
| Security Auditor | Read-only (all services) | No | No | Read-only | No | No (explicit deny) |
| DevOps | Limited | Yes | Yes | Yes | Yes | No |
| Read-Only | Read-only | No | No | No | No | No |

### Audit Trail

| System | What It Captures | Retention |
|--------|-----------------|-----------|
| CloudTrail | Every AWS API call (who, what, when, from where) | 90 days (default) |
| VPC Flow Logs | Network traffic metadata (source, destination, port, action) | 30 days |
| CloudWatch Logs | Application logs, error traces | 30 days |
| Git History | All code and configuration changes | Permanent |
| Terraform State | Infrastructure resource mapping | Current + 1 backup |

## 2. Risk Assessment

### Risk Matrix

| ID | Risk | Likelihood | Impact | Risk Score | Mitigation | Residual Risk |
|----|------|-----------|--------|------------|------------|---------------|
| R1 | S3 bucket public exposure | Low | Critical | High | Block Public Access, bucket policy, Config rules, GuardDuty | Low |
| R2 | EC2 instance compromise via SSH | Medium | High | High | Ed25519 keys, SG restricted to single IP, fail2ban (planned) | Medium |
| R3 | Database credential leak | Low | High | Medium | Secrets Manager (planned), no plaintext in code, .gitignore | Low |
| R4 | Cost overrun beyond budget | Medium | Low | Low | Budget alarms at $8/$10/$15/$20, auto-notification | Low |
| R5 | IAM privilege escalation | Low | Critical | Medium | Permission boundaries, explicit deny policies, Access Analyzer | Low |
| R6 | Unpatched OS vulnerabilities | Medium | High | High | Regular dnf update, Amazon Linux 2023 auto-patching | Medium |
| R7 | CloudTrail log tampering | Low | High | Medium | Log file validation enabled, S3 versioning on log bucket | Low |
| R8 | JWT token theft | Medium | Medium | Medium | Short token expiry (1hr), HTTPS enforced, HttpOnly cookies (planned) | Medium |

### Risk Acceptance

Risks accepted due to budget constraints:

- **No Multi-AZ deployment:** Single AZ means an AZ outage takes down the entire application. Accepted because this is a portfolio project, not production. Cost of Multi-AZ: ~$15/mo additional.
- **No WAF on CloudFront:** AWS WAF costs $5/mo base + $1/rule/mo. Accepted due to budget. Would implement for production.
- **Self-hosted PostgreSQL:** No automated backups, no failover. Accepted because data is reproducible (seed script). Would use RDS for production.

## 3. Compliance Mapping

### NIST 800-53 Controls

| Control ID | Control Name | Implementation | Status |
|-----------|-------------|---------------|--------|
| AC-2 | Account Management | IAM users managed via groups, no shared accounts | Implemented |
| AC-3 | Access Enforcement | IAM policies with resource-level ARN scoping | Implemented |
| AC-6 | Least Privilege | Custom policies, no wildcards on sensitive actions | Implemented |
| AC-6(1) | Authorize Access to Security Functions | Permission boundaries cap maximum privileges | Implemented |
| AC-17 | Remote Access | SSH restricted to single IP, ed25519 keys only | Implemented |
| AU-2 | Audit Events | CloudTrail captures all API calls | Implemented |
| AU-3 | Content of Audit Records | CloudTrail records who, what, when, source IP, user agent | Implemented |
| AU-6 | Audit Review | GuardDuty automated analysis, manual CloudTrail review | Partial |
| AU-9 | Protection of Audit Info | CloudTrail log validation, S3 versioning | Implemented |
| CA-7 | Continuous Monitoring | AWS Config rules, GuardDuty, CloudWatch alarms | Implemented |
| CM-2 | Baseline Configuration | Terraform defines the baseline, drift detectable via plan | Implemented |
| IA-2 | Identification and Authentication | Cognito for users, IAM for infrastructure | Implemented |
| IA-2(1) | MFA for Privileged Accounts | MFA on root and admin IAM user | Implemented |
| IA-5 | Authenticator Management | 12-char password policy, MFA optional, JWT rotation | Implemented |
| SC-7 | Boundary Protection | VPC with security groups, public/private subnet design | Implemented |
| SC-8 | Transmission Confidentiality | TLS 1.2+ on CloudFront, HTTPS enforced | Implemented |
| SC-28 | Protection of Information at Rest | SSE-S3 on audio bucket, encrypted EBS volume | Implemented |
| SI-4 | Information System Monitoring | CloudWatch metrics/alarms, GuardDuty threat detection | Implemented |

### CIS AWS Foundations Benchmark v3.0

| Control | Description | Status |
|---------|------------|--------|
| 1.4 | Ensure no root access key exists | Compliant |
| 1.5 | Ensure MFA is enabled for root | Compliant |
| 1.10 | Ensure MFA is enabled for IAM users with console access | Compliant |
| 2.1.1 | Ensure CloudTrail is enabled in all regions | Compliant |
| 2.1.2 | Ensure CloudTrail log file validation is enabled | Compliant |
| 2.2.1 | Ensure GuardDuty is enabled | Compliant |
| 3.1 | Ensure S3 bucket Block Public Access is enabled | Compliant |
| 3.3 | Ensure S3 bucket server-side encryption is enabled | Compliant |
| 5.1 | Ensure no security groups allow ingress on port 22 from 0.0.0.0/0 | Compliant (restricted to admin IP) |

## 4. Security Controls Summary

### Preventive Controls (stop bad things from happening)

- IAM policies with least privilege
- Permission boundaries as ceilings
- S3 Block Public Access
- Security groups restricting network access
- Encryption at rest and in transit

### Detective Controls (find bad things that happened)

- CloudTrail API logging
- GuardDuty threat detection
- AWS Config compliance rules
- CloudWatch alarms (billing + CPU)
- IAM Access Analyzer

### Corrective Controls (fix bad things)

- Terraform `prevent_destroy` on security resources
- Incident response process (documented in postmortem)
- Budget alarms with escalation thresholds
