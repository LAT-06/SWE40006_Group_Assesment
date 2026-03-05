# AWS Serverless Deployment + CI/CD Guide

Deploying Deployma on AWS with near-zero cost using serverless infrastructure and automated GitHub Actions pipelines.

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

## Part 3 — CI/CD with GitHub Actions

### 3.1 Add secrets to GitHub

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_REGION` | e.g. `ap-southeast-2` |
| `S3_BUCKET` | your frontend bucket name |
| `CLOUDFRONT_DISTRIBUTION_ID` | from CloudFront console |
| `VITE_SUPABASE_URL` | your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_API_URL` | API Gateway URL from SAM output |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret |
| `TF_STATE_BUCKET` | Name of the S3 bucket used for Terraform remote state (created in Part 5) |
| `CLOUDFRONT_DOMAIN` | CloudFront domain after first `terraform apply` (e.g. `d1234.cloudfront.net`) |

### 3.2 IAM user permissions

Create a dedicated IAM user for GitHub Actions with this policy (least-privilege):

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
        "arn:aws:s3:::deployma-frontend-YOUR_BUCKET_NAME",
        "arn:aws:s3:::deployma-frontend-YOUR_BUCKET_NAME/*"
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
        "cloudformation:*",
        "lambda:*",
        "apigateway:*",
        "iam:PassRole",
        "iam:GetRole",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:DeleteRole",
        "s3:CreateBucket",
        "s3:PutBucketVersioning"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3.3 Frontend CI/CD workflow

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - "frontend/**"
      - ".github/workflows/deploy-frontend.yml"

jobs:
  deploy:
    name: Build & Deploy to S3 + CloudFront
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Build
        working-directory: frontend
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
        run: npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Sync to S3
        run: |
          # Upload all assets with long cache (content-hashed filenames)
          aws s3 sync frontend/dist/assets s3://${{ secrets.S3_BUCKET }}/assets \
            --cache-control "public, max-age=31536000, immutable" \
            --delete

          # Upload HTML files with no cache (always fresh)
          aws s3 sync frontend/dist s3://${{ secrets.S3_BUCKET }} \
            --exclude "assets/*" \
            --cache-control "no-cache, no-store, must-revalidate" \
            --delete

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

### 3.4 Backend CI/CD workflow

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - "backend/**"
      - ".github/workflows/deploy-backend.yml"

jobs:
  deploy:
    name: Build & Deploy to Lambda
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Type-check
        working-directory: backend
        run: npm run type-check

      - name: Run tests
        working-directory: backend
        run: npm test -- --run

      - name: Build
        working-directory: backend
        run: npm run build

      - name: Package Lambda
        working-directory: backend
        run: |
          mkdir -p lambda_pkg
          cp -r dist/ lambda_pkg/dist
          cp package.json lambda_pkg/
          cd lambda_pkg && npm install --omit=dev --ignore-scripts && cd ..
          zip -r ../terraform/backend.zip lambda_pkg/
          rm -rf lambda_pkg

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        working-directory: terraform
        run: |
          terraform init \
            -backend-config="bucket=${{ secrets.TF_STATE_BUCKET }}" \
            -backend-config="region=${{ secrets.AWS_REGION }}"

      - name: Terraform Apply
        working-directory: terraform
        env:
          TF_VAR_supabase_url: ${{ secrets.SUPABASE_URL }}
          TF_VAR_supabase_anon_key: ${{ secrets.SUPABASE_ANON_KEY }}
          TF_VAR_supabase_service_role_key: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          TF_VAR_supabase_jwt_secret: ${{ secrets.SUPABASE_JWT_SECRET }}
          TF_VAR_allowed_origins: "https://${{ secrets.CLOUDFRONT_DOMAIN }}"
        run: terraform apply -auto-approve
```

### 3.5 Combined PR check workflow (runs on every PR, no deploy)

Create `.github/workflows/ci.yml`:

```yaml
name: CI Checks

on:
  pull_request:
    branches: [main]

jobs:
  frontend:
    name: Frontend — type-check + build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
        working-directory: frontend
      - run: npm run build
        working-directory: frontend
        env:
          VITE_SUPABASE_URL: https://placeholder.supabase.co
          VITE_SUPABASE_ANON_KEY: placeholder
          VITE_API_URL: http://localhost:3000

  backend:
    name: Backend — type-check + test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
        working-directory: backend
      - run: npm run type-check
        working-directory: backend
      - run: npm test -- --run
        working-directory: backend
```

---

## Part 4 — Full Deployment Flow

```
Developer pushes to main
         │
         ├──[frontend/** changed]──► GitHub Actions: deploy-frontend.yml
         │                               1. npm ci
         │                               2. npm run build  (Vite bundles to dist/)
         │                               3. aws s3 sync    (assets + HTML to S3)
         │                               4. CloudFront invalidation  (cache busted)
         │                               └─► Live at https://d1234.cloudfront.net
         │
         └──[backend/** changed]───► GitHub Actions: deploy-backend.yml
                                         1. npm ci
                                         2. tsc --noEmit   (type-check)
                                         3. vitest --run   (tests)
                                         4. npm run build  (tsc → dist/)
                                         5. zip dist/ + node_modules (Lambda package)
                                         6. terraform apply (update Lambda + API Gateway)
                                         └─► Live at https://xxxx.execute-api.region.amazonaws.com
```

### On a Pull Request (no deploy)

```
PR opened / commit pushed to PR branch
         │
         └──► GitHub Actions: ci.yml
                  ├── frontend: type-check + build (with placeholder env vars)
                  └── backend:  type-check + tests
                  
              All green → PR can be merged
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
  -var="supabase_anon_key=YOUR_ANON_KEY" \
  -var="supabase_service_role_key=YOUR_SERVICE_KEY" \
  -var="supabase_jwt_secret=YOUR_JWT_SECRET"
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

Update GitHub secrets with these values after the first deploy. On subsequent `terraform apply` runs (code changes only), the values stay the same.

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
