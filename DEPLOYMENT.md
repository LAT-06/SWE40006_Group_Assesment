# AWS Serverless Deployment + CI/CD Guide

Deploying Deployma on AWS with near-zero cost using serverless infrastructure and a Jenkins pipeline running on your home server.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        Internet                         │
└──────────────────┬─────────────────┬────────────────────┘
                   │                 │
         ┌─────────▼──────┐  ┌───────▼────────┐
         │  CloudFront CDN │  │  API Gateway   │
         │  (HTTPS + Cache)│  │  (HTTP API)    │
         └─────────┬───────┘  └───────┬────────┘
                   │                  │
         ┌─────────▼───────┐  ┌───────▼────────┐
         │   S3 Bucket     │  │ Lambda Function │
         │ (Vue 3 dist/)   │  │ (Express app)  │
         └─────────────────┘  └───────┬────────┘
                                      │
                             ┌────────▼────────┐
                             │    Supabase     │
                             │  (DB + Auth)    │
                             └─────────────────┘
```

---

## Cost Estimate (small-medium project)

| Service | Free Tier | After Free Tier |
|---|---|---|
| S3 (frontend storage) | 5 GB storage, 20k GET/month | ~$0.023/GB |
| CloudFront | 1 TB transfer/month free | $0.0085/10k requests |
| Lambda | 1M requests + 400k GB-sec/month free | $0.20/1M requests |
| API Gateway (HTTP) | 1M calls/month free | $1.00/1M calls |
| **Total (typical small app)** | **$0/month** | **< $5/month** |

> Supabase has its own free tier (2 projects, 500 MB DB, 50k MAU auth).

---

## Part 1 — Backend: Lambda + API Gateway

### 1.1 Install the Lambda adapter

```bash
cd backend
npm install @vendia/serverless-express
npm install -D @types/aws-lambda
```

### 1.2 Create the Lambda entry point

Create `backend/src/apps/server/lambda.ts`:

```ts
import serverlessExpress from "@vendia/serverless-express";
import type { Handler } from "aws-lambda";
import { Server } from "./app.js";

// Build the Express app once (cold start), reuse on warm invocations
const server = new Server("3000");
const app = server.httpServer;

export const handler: Handler = serverlessExpress({ app });
```

### 1.3 Update tsconfig.json to include lambda entry

`backend/tsconfig.json` already includes all of `src/**/*`, so `lambda.ts` is picked up automatically.

### 1.4 Infrastructure — managed by Terraform

All AWS resources (Lambda, API Gateway, S3, CloudFront, IAM roles) are declared in `terraform/`. Jump to **Part 5** to create everything with a single `terraform apply` — no SAM CLI or CloudFormation needed.

---

## Part 2 — Frontend: S3 + CloudFront

Both the S3 bucket and CloudFront distribution are **provisioned automatically by Terraform** in Part 5 — no manual CLI setup needed.

Terraform configures CloudFront with:
- **OAC** (Origin Access Control) — S3 bucket is never publicly accessible
- **SPA fallback** — `403/404 → /index.html` so Vue Router history mode works
- `index.html` with no-cache; content-hashed assets with 1-year immutable cache (handled by the deploy workflow)

After `terraform apply`, retrieve your URLs:
```bash
terraform -chdir=terraform output cloudfront_domain  # your frontend URL
terraform -chdir=terraform output api_url             # your backend URL
```

---

## Part 3 — CI/CD with Jenkins (Home Server)

The `Jenkinsfile` at the repo root drives all pipelines. It runs CI checks on every branch and deploys only when on `main`.

### 3.1 Install Jenkins on your home server

**Option A — Docker (recommended)**
```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts
# Get the one-time admin password:
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

**Option B — Native (Ubuntu/Debian)**
```bash
sudo apt install -y openjdk-17-jdk
curl -fsSL https://pkg.jenkins.io/debian/jenkins.io-2023.key \
  | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian binary/" \
  | sudo tee /etc/apt/sources.list.d/jenkins.list
sudo apt update && sudo apt install -y jenkins
```

### 3.2 Install required tools on the Jenkins host

Jenkins runs build commands directly on the host — these must be present:

```bash
# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Terraform
sudo apt install -y gnupg software-properties-common
wget -O- https://apt.releases.hashicorp.com/gpg \
  | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
  https://apt.releases.hashicorp.com $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install -y terraform

# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip
unzip awscliv2.zip && sudo ./aws/install
```

### 3.3 Expose Jenkins so GitHub can send webhooks

GitHub needs to reach your home server. Choose one:

**Option A — Cloudflare Tunnel (free, no port forwarding)**
```bash
# Install cloudflared
curl -L -o cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
# Start a quick tunnel (returns a public HTTPS URL)
cloudflared tunnel --url http://localhost:8080
```

**Option B — ngrok**
```bash
ngrok http 8080
# Returns https://xxxx.ngrok-free.app
```

**Option C — Router port forwarding**
Forward external TCP port 8080 → your server's LAN IP:8080. Use DuckDNS (free) for a stable hostname if you don't have a static IP.

**Fallback — Poll SCM** (no exposure needed)
In the Jenkins job → Build Triggers → **Poll SCM** → schedule `H/1 * * * *`. Jenkins checks GitHub every minute without needing an inbound connection.

### 3.4 Install Jenkins plugins

**Dashboard → Manage Jenkins → Plugins → Available plugins** — install:

| Plugin | Purpose |
|---|---|
| **Git** | Clone the repo |
| **Pipeline** | Declarative `Jenkinsfile` support |
| **GitHub** | Webhook trigger integration |
| **Credentials Binding** | Inject secrets into pipeline steps |
| **Workspace Cleanup** | `cleanWs()` in post block |

### 3.5 Add credentials to Jenkins

**Dashboard → Manage Jenkins → Credentials → (global) → Add Credential**
Type: **Secret text** for all entries.

| Credential ID | Value |
|---|---|
| `aws-access-key-id` | IAM user access key |
| `aws-secret-access-key` | IAM user secret key |
| `aws-region` | e.g. `ap-southeast-2` |
| `s3-bucket` | frontend bucket name (from `terraform output frontend_bucket`) |
| `cloudfront-distribution-id` | from `terraform output cloudfront_distribution_id` |
| `cloudfront-domain` | e.g. `d1234.cloudfront.net` (from `terraform output cloudfront_domain`) |
| `vite-supabase-url` | Supabase project URL |
| `vite-supabase-anon-key` | Supabase anon key |
| `vite-api-url` | API Gateway URL (from `terraform output api_url`) |
| `supabase-url` | Supabase project URL |
| `supabase-anon-key` | Supabase anon key |
| `tf-state-bucket` | S3 bucket for Terraform remote state (from Part 5.2) |

### 3.6 IAM user permissions for Jenkins

Create a dedicated IAM user for Jenkins with this least-privilege policy (AWS Console → IAM → Users → Create user → Attach policy directly → JSON):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject", "s3:GetObject", "s3:DeleteObject",
        "s3:ListBucket", "s3:PutObjectAcl"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_FRONTEND_BUCKET_NAME",
        "arn:aws:s3:::YOUR_FRONTEND_BUCKET_NAME/*",
        "arn:aws:s3:::YOUR_TF_STATE_BUCKET_NAME",
        "arn:aws:s3:::YOUR_TF_STATE_BUCKET_NAME/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:*",
        "apigateway:*",
        "iam:PassRole", "iam:GetRole",
        "iam:CreateRole", "iam:AttachRolePolicy",
        "iam:DetachRolePolicy", "iam:DeleteRole",
        "s3:CreateBucket", "s3:PutBucketVersioning"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3.7 Create the Jenkins pipeline job

1. **Dashboard → New Item → Multibranch Pipeline** → name it `deployma`
   *(Multibranch lets CI checks run on PRs while deploys only fire on `main`)*
2. **Branch Sources → Add source → GitHub**
   - Credentials: add a GitHub Personal Access Token
   - Repository HTTPS URL: your GitHub repo URL
3. **Build Configuration → Mode**: by Jenkinsfile
4. **Script Path**: `Jenkinsfile` *(default — already at repo root)*
5. **Scan Multibranch Pipeline Triggers**: check **Periodically if not otherwise run** → interval `1 minute` (fallback scan)
6. Save → Jenkins will scan the repo and create a pipeline for `main` automatically.

### 3.8 Add GitHub webhook

In your GitHub repo → **Settings → Webhooks → Add webhook**:

| Field | Value |
|---|---|
| Payload URL | `https://YOUR_JENKINS_URL/multibranch-webhook-trigger/invoke?token=deployma` |
| Content type | `application/json` |
| Trigger | Just the **push** event |

> Install the **Multibranch Scan Webhook Trigger** plugin first, or use the simpler payload URL `https://YOUR_JENKINS_URL/github-webhook/` with the **GitHub** plugin.

---

## Part 4 — Full Deployment Flow

```
Git push to any branch
         │
         ├── Stage 1: Install        (parallel: frontend + backend npm ci)
         │
         ├── Stage 2: Code Scan      (parallel — runs on ALL branches)
         │         ├── Frontend: Type Check     (vue-tsc --build)
         │         ├── Frontend: Security Audit (npm audit --audit-level=high)
         │         ├── Backend:  Type Check     (tsc --noEmit)
         │         ├── Backend:  Unit Tests     (vitest --run)
         │         └── Backend:  Security Audit (npm audit --audit-level=high)
         │
         │   ✖ Any failure above → pipeline stops, no deploy
         │
         ├── Stage 3: Build          (when: branch = main only)
         │         ├── Frontend: Vite build  → dist/
         │         └── Backend:  tsc build   → dist/
         │
         ├── Stage 4: Package Lambda (when: branch = main)
         │         zip dist/ + prod node_modules → terraform/backend.zip
         │
         ├── Stage 5: Deploy Frontend (when: branch = main)
         │         1. aws s3 sync assets  → 1-year immutable cache
         │         2. aws s3 sync HTML    → no-cache
         │         3. CloudFront cache invalidation
         │         └─► Live at https://d1234.cloudfront.net
         │
         └── Stage 6: Deploy Backend  (when: branch = main)
                   1. terraform init  (pull shared state from S3)
                   2. terraform apply (update Lambda code + API Gateway)
                   └─► Live at https://xxxx.execute-api.region.amazonaws.com
```

### On a feature branch / PR (scan only, no deploy)

```
Push to feature-branch / PR
         │
         ├── Stage 1: Install
         ├── Stage 2: Code Scan  ← all 5 checks run in parallel
         └── Stages 3–6 SKIPPED  (when { branch 'main' } not satisfied)

         All green → safe to merge
         Any failure → blocks merge
```

---

## Part 5 — First Deploy with Terraform

Run this once from your machine to provision all AWS infrastructure and do the first deploy.

### 5.1 Install tools

```bash
brew install terraform awscli
aws configure
# Prompts: Access Key ID, Secret Access Key, region (ap-southeast-2), output (json)
```

### 5.2 Create S3 bucket for Terraform state (one-time)

Terraform stores state remotely so CI/CD can share it:

```bash
aws s3 mb s3://deployma-tf-state-YOURNAME --region ap-southeast-2
aws s3api put-bucket-versioning \
  --bucket deployma-tf-state-YOURNAME \
  --versioning-configuration Status=Enabled
```

Then open `terraform/main.tf` and fill in the `backend "s3"` block:

```hcl
backend "s3" {
  bucket = "deployma-tf-state-YOURNAME"
  key    = "deployma/terraform.tfstate"
  region = "ap-southeast-2"
}
```

### 5.3 Build and package the backend

```bash
cd backend
npm ci && npm run build

# Stage dist/ + production node_modules into a zip
mkdir -p lambda_pkg
cp -r dist/ lambda_pkg/dist
cp package.json lambda_pkg/
cd lambda_pkg && npm install --omit=dev --ignore-scripts && cd ..
zip -r ../terraform/backend.zip lambda_pkg/
rm -rf lambda_pkg
```

### 5.4 Provision all infrastructure

```bash
cd ../terraform
terraform init
terraform apply \
  -var="supabase_url=https://xxx.supabase.co" \
  -var="supabase_anon_key=YOUR_ANON_KEY"
```

Type `yes` when prompted. Terraform will create:
- Lambda function + API Gateway HTTP API (backend)
- S3 bucket + CloudFront distribution (frontend)
- All IAM roles and policies

### 5.5 Save the outputs as GitHub secrets

```bash
terraform output api_url            # → AWS_API_URL, VITE_API_URL
terraform output cloudfront_domain  # → CLOUDFRONT_DOMAIN
terraform output cloudfront_distribution_id  # → CLOUDFRONT_DISTRIBUTION_ID
terraform output frontend_bucket    # → S3_BUCKET
```

### 5.6 Deploy the frontend for the first time

```bash
cd ../frontend

VITE_SUPABASE_URL=https://xxx.supabase.co \
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY \
VITE_API_URL=$(terraform -chdir=../terraform output -raw api_url) \
npm run build

BUCKET=$(terraform -chdir=../terraform output -raw frontend_bucket)
DIST_ID=$(terraform -chdir=../terraform output -raw cloudfront_distribution_id)

aws s3 sync dist/assets s3://$BUCKET/assets \
  --cache-control "public, max-age=31536000, immutable" --delete
aws s3 sync dist s3://$BUCKET \
  --exclude "assets/*" \
  --cache-control "no-cache, no-store, must-revalidate" --delete

aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

---

## Part 6 — Getting output values

After any `terraform apply`, retrieve all URLs and IDs:

```bash
terraform -chdir=terraform output api_url                   # Backend API URL → VITE_API_URL
terraform -chdir=terraform output cloudfront_domain        # Frontend URL → CLOUDFRONT_DOMAIN
terraform -chdir=terraform output cloudfront_distribution_id  # → CLOUDFRONT_DISTRIBUTION_ID
terraform -chdir=terraform output frontend_bucket          # S3 bucket name → S3_BUCKET
```

Update the Jenkins credentials with these values after the first deploy. On subsequent `terraform apply` runs (code changes only), the values stay the same.

---

## Part 7 — Monitoring & Logs

```bash
# View Lambda logs live
aws logs tail /aws/lambda/deployma-backend --follow

# Or via AWS Console:
# CloudWatch → Log groups → /aws/lambda/deployma-backend
```

Lambda errors also appear in CloudWatch Metrics automatically — set up a CloudWatch Alarm to email you on error spikes (free within CloudWatch free tier).

---

## Quick Reference

| What | Command |
|---|---|
| Provision / update all infrastructure | `cd terraform && terraform apply` |
| View Lambda logs live | `aws logs tail /aws/lambda/deployma-backend --follow` |
| Get API URL | `terraform -chdir=terraform output -raw api_url` |
| Get CloudFront domain | `terraform -chdir=terraform output -raw cloudfront_domain` |
| Invalidate CloudFront cache | `aws cloudfront create-invalidation --distribution-id $(terraform -chdir=terraform output -raw cloudfront_distribution_id) --paths "/*"` |
| Destroy all AWS resources | `cd terraform && terraform destroy` |
