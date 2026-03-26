# CloudFormation Supplementary Templates

These templates implement the same infrastructure as the Terraform modules in `/terraform/modules/` for comparison purposes. They are NOT deployed — the Terraform versions are the live infrastructure.

## Templates

| Template | Terraform Equivalent | Resources |
|----------|---------------------|-----------|
| `vpc-networking.yaml` | `terraform/modules/vpc/` | VPC, subnet, IGW, route table, security group |
| `s3-security.yaml` | `terraform/modules/s3/` | Audio bucket with encryption, versioning, lifecycle, CORS, bucket policy |

## Key Differences: Terraform vs CloudFormation

| Aspect | Terraform | CloudFormation |
|--------|-----------|---------------|
| State management | You manage (local or S3 backend) | AWS manages automatically |
| Rollback | Manual — no auto-rollback | Automatic rollback on failure |
| Multi-cloud | Yes (AWS, GCP, Azure) | AWS only |
| Resource import | `terraform import` | CloudFormation import |
| Selective destroy | Target specific resources | Delete entire stack |
| Validation | `terraform validate` + `plan` | `aws cloudformation validate-template` |
| Drift detection | `terraform plan` shows drift | Stack drift detection |

## How to validate (without deploying)
```bash
aws cloudformation validate-template --template-body file://vpc-networking.yaml
aws cloudformation validate-template --template-body file://s3-security.yaml
```

## How you WOULD deploy (don't — Terraform manages the live infra)
```bash
aws cloudformation create-stack \
  --stack-name spotify-vpc \
  --template-body file://vpc-networking.yaml \
  --parameters ParameterKey=AdminIP,ParameterValue=YOUR_IP/32
```
