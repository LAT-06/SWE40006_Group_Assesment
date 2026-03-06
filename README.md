# Deployma — Grocery Delivery Platform

A full-stack grocery delivery platform built with Vue 3, TypeScript, Express, and Supabase.

---

## Features

### Customer-Facing
- Browse products by category with real-time search and filters (price, stock, dietary, sale)
- Product detail pages with live stock status (In Stock / Low Stock / Out of Stock)
- Real-time stock updates — badges update instantly without page refresh
- Shopping cart with stock validation — warns when quantity exceeds available stock, blocks checkout until resolved
- Place orders with address, delivery zone and time-slot selection
- Promo code validation at checkout
- Order tracking with live status updates
- User profile management
- "You May Also Like" related products on product detail page

### Authentication
- Email/password sign-up and login
- Google OAuth
- Session persistence across browser refreshes (stored in localStorage)
- Password reset flow

### Admin Portal (`/admin`)
- **Dashboard** — live stats (orders, revenue, users, products)
- **Products** — full CRUD, real-time stock badge on every row
- **Categories** — full CRUD with slug auto-generation
- **Stock Management** — sorted stock table with Low Stock / Out of Stock filters, inline quantity editor; refreshes automatically via real-time Supabase subscription
- **Orders** — list, view detail, change status, cancel
- **Delivery Slots** — create/edit/delete time slots per zone and date
- **Delivery Zones** — manage zones with suburb lists and active/inactive toggle
- **Stores** — store location management with inventory tracking
- **Users** — list all users, promote/demote admin role

---

## Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| Vue 3 + Composition API | UI framework |
| TypeScript | Type safety |
| Pinia | State management |
| Vue Router | Navigation + auth guards |
| Supabase JS | Auth, realtime, database queries |
| Vite | Dev server & production build |

### Backend
| Tool | Purpose |
|---|---|
| Node.js + Express 5 | HTTP server |
| TypeScript (ESM) | Type-safe server code |
| tsx | TypeScript runtime (dev) |
| Supabase JS | Database + service-role access |
| jose | JWT verification |

### Database
- **Supabase** (PostgreSQL) with Row Level Security
- Migrations in `supabase/migrations/`
- Key tables: `products`, `categories`, `orders`, `order_items`, `carts`, `cart_items`, `delivery_slots`, `delivery_zones`, `profiles`, `stores`, `store_inventory`, `promo_codes`

---

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── apps/server/
│   │   │   ├── controllers/        # One controller per endpoint
│   │   │   ├── routes/             # Express route registration
│   │   │   ├── middlewares/        # Auth middleware (JWT)
│   │   │   ├── app.ts              # Express app setup
│   │   │   └── start.ts            # Server entry point
│   │   └── Contexts/Shared/infrastructure/persistence/supabase/
│   │       └── SupabaseClientFactory.ts
│   ├── tests/
│   │   └── product.test.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── HomeView.vue           # Homepage / product listing
│   │   │   ├── CategoryView.vue       # Browse by category + search + filters
│   │   │   ├── ProductDetailView.vue  # Product info, live stock, add to cart
│   │   │   ├── CartView.vue           # Cart, checkout flow, order placement
│   │   │   ├── OrderTrackingView.vue  # Track order status
│   │   │   ├── AdminView.vue          # Full admin portal
│   │   │   ├── LoginView.vue          # Sign in / sign up
│   │   │   ├── SignupView.vue
│   │   │   ├── ProfileView.vue
│   │   │   └── ResetPasswordView.vue
│   │   ├── stores/
│   │   │   ├── auth.ts               # Auth state (Pinia)
│   │   │   ├── cart.ts               # Cart state
│   │   │   └── products.ts           # Product list state
│   │   ├── lib/
│   │   │   ├── supabase.ts           # Supabase client
│   │   │   └── models.ts             # Generated DB types
│   │   ├── router/
│   │   │   └── index.ts              # Routes + auth guards
│   │   ├── App.vue
│   │   └── main.ts
│   └── vite.config.ts
│
├── supabase/
│   ├── config.toml
│   └── migrations/                   # All DB migrations (run in order)
│
└── compose.yml                       # Docker Compose for local dev
```

---

## Setup

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Database — Run Migrations

In the Supabase Dashboard → SQL Editor, run each file in `supabase/migrations/` in **chronological order**:

```
20260203100000_initial_schema.sql
20260203100001_add_missing_tables.sql
20260203100002_fix_admin_rls.sql
20260203120000_add_product_quantity.sql
20260219000000_delivery_slots_and_order_updates.sql
20260304000000_user_management.sql
20260304120000_fix_rls_anon_key.sql
20260305000000_stores.sql
20260305010000_delivery_zones_suburbs.sql
20260305020000_fix_security_warnings.sql
20260305030000_fix_performance_warnings.sql
20260305040000_product_stock_management.sql
```

### 2. Backend

```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY,
#          SUPABASE_JWT_SECRET, PORT (default 3000), ALLOWED_ORIGINS, ADMIN_EMAILS

npm run dev       # Development (hot-reload via tsx watch)
```

### 3. Frontend

```bash
cd frontend
npm install

# Create environment file
cp .env.example .env
# Fill in: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL

npm run dev       # Development server at http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173
ADMIN_EMAILS=admin@example.com
```

### Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3000
```

---

## Development Commands

### Backend
```bash
npm run dev          # Start with hot-reload (tsx watch)
npm run start        # Start without hot-reload
npm run build        # Compile TypeScript → dist/
npm run type-check   # Type-check without emitting
npm run test         # Run tests with Vitest
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Type-check + build for production (dist/)
npm run preview      # Preview production build
npm run test:unit    # Run unit tests with Vitest
```

---

## Routes

| Path | Description | Auth Required |
|---|---|---|
| `/` | Homepage | No |
| `/category/:slug?` | Browse products | No |
| `/product/:id` | Product detail | No |
| `/cart` | Cart & checkout | Yes |
| `/order-tracking/:orderId?` | Order status | Yes |
| `/profile` | User profile | Yes |
| `/admin` | Admin portal | Admin only |
| `/login` | Sign in / sign up | No |
| `/signup` | Sign up | No |
| `/reset-password` | Password reset | No |

---

## Admin Access

To make a user an admin, either:
- Set `role = 'admin'` in the `profiles` table via Supabase Dashboard, or
- Use the Users section in the Admin Portal to promote an existing user

---

## CI/CD Pipeline

The project uses **GitHub Actions** for automated testing and deployment. All workflows are in `.github/workflows/`.

```
Push to any branch
        │
        ▼
┌─────────────────────────────┐
│   ci.yml — Code Scan        │  ← runs on EVERY push & PR
│   5 jobs run in parallel:   │
│   • Frontend Type Check     │
│   • Frontend Security Audit │
│   • Backend Type Check      │
│   • Backend Unit Tests      │
│   • Backend Security Audit  │
└─────────────────────────────┘

Push to main / lat  +  backend/** or terraform/** changed
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│   deploy-backend.yml — Lambda Deploy                    │
│   1. npm ci                                             │
│   2. tsc type-check                                     │
│   3. vitest unit tests                                  │
│   4. tsc build → dist/                                  │
│   5. Package Lambda zip (prod deps only, files at root) │
│   6. Configure AWS credentials                          │
│   7. terraform init  (S3 remote state)                  │
│   8. terraform apply (update Lambda + API Gateway)      │
└─────────────────────────────────────────────────────────┘
```

### Workflow 1: `ci.yml` — Code Scan

Runs on **every push** to every branch and every pull request. Five jobs run in parallel:

| Job | What it does |
|---|---|
| Frontend: Type Check | `vue-tsc --noEmit` — catches TypeScript errors in Vue components |
| Frontend: Security Audit | `npm audit --audit-level=high` — flags known high/critical CVEs in frontend deps |
| Backend: Type Check | `tsc --noEmit` — catches TypeScript errors in Express code |
| Backend: Unit Tests | `vitest --run` — runs all tests in `backend/tests/` |
| Backend: Security Audit | `npm audit --audit-level=high` — flags known CVEs in backend deps |

> Security audit failures are reported but do **not** block the pipeline (`|| true`) — this lets you see issues without stopping development. Remove `|| true` once all audits are clean.

### Workflow 2: `deploy-backend.yml` — Lambda Deploy

Triggers on push to `main` or `lat` **only when** files under `backend/**`, `terraform/**`, or the workflow itself changed. This avoids unnecessary deploys when only frontend files are edited.

**Steps in detail:**

| Step | Description |
|---|---|
| Install | `npm ci` — exact install from `package-lock.json` |
| Type Check | Fail fast before wasting time building broken code |
| Unit Tests | Fail fast before deploying broken code |
| Build | `tsc → dist/` — compiles TypeScript to JavaScript ESM |
| Package Lambda zip | `cd lambda_pkg && zip -r ../terraform/backend.zip .` — zips from **inside** the directory so `dist/` is at root of zip, matching the Lambda handler path `dist/apps/server/lambda.handler` |
| Configure AWS | `aws-actions/configure-aws-credentials@v4` using repository secrets |
| Terraform Init | Initialises with S3 remote state backend (`-backend-config` flags pass bucket/region from secrets) |
| Terraform Apply | Creates/updates Lambda, API Gateway, S3, CloudFront with `-auto-approve` |

### Frontend Deployment

Frontend is deployed manually by syncing the Vite build output to the S3 bucket and invalidating CloudFront:

```bash
cd frontend
npm run build          # outputs to dist/
aws s3 sync dist/ s3://deployma-frontend --delete
aws cloudfront create-invalidation \
  --distribution-id E2CBNE931GJK7K \
  --paths "/*"
```

> A GitHub Actions workflow for automated frontend deployment can be added following the same pattern as `deploy-backend.yml`.

---

## Terraform Infrastructure

All AWS infrastructure is defined as code in `terraform/`. The Terraform state is stored remotely in S3 so the whole team can share it.

### Remote State

| Setting | Value |
|---|---|
| Backend | S3 |
| State bucket | `deployma-tf-state-lat` |
| State key | `deployma/terraform.tfstate` |
| Region | `ap-southeast-2` |

The `bucket` and `region` values are intentionally **not hard-coded** in `terraform/main.tf` — they are passed via `-backend-config` flags in CI or on first local init:

```bash
terraform init \
  -backend-config="bucket=deployma-tf-state-lat" \
  -backend-config="region=ap-southeast-2"
```

### Resources Created

| Resource | Name | Purpose |
|---|---|---|
| `aws_s3_bucket` | `deployma-lambda-packages` | Stores Lambda deployment zip files |
| `aws_s3_bucket_versioning` | — | Versioning enabled on Lambda packages bucket |
| `aws_iam_role` | `deployma-lambda-exec` | IAM execution role for Lambda with basic execution policy |
| `aws_s3_object` | `backend.zip` | The uploaded Lambda deployment zip |
| `aws_lambda_function` | `deployma-backend` | Express app running serverless; Node.js 22 ARM64, 256 MB, 30 s timeout |
| `aws_apigatewayv2_api` | `deployma-api` | HTTP API Gateway (AWS_PROXY integration) |
| `aws_apigatewayv2_integration` | — | Connects API Gateway to Lambda with payload format v2.0 |
| `aws_apigatewayv2_route` | `$default` | Catch-all route → passes every request to Lambda |
| `aws_apigatewayv2_stage` | `$default` | Auto-deploy stage |
| `aws_lambda_permission` | — | Grants API Gateway permission to invoke Lambda |
| `aws_s3_bucket` | `deployma-frontend` | Hosts the Vue production build (private) |
| `aws_s3_bucket_public_access_block` | — | Blocks all public S3 access; traffic only via CloudFront |
| `aws_cloudfront_origin_access_control` | `deployma-oac` | Sigv4-signed requests from CloudFront to S3 |
| `aws_cloudfront_distribution` | — | CDN for frontend; redirects HTTP→HTTPS; returns `index.html` for 403/404 (Vue Router history mode) |
| `aws_s3_bucket_policy` | — | Allows only CloudFront OAC to read from the frontend bucket |

### Lambda Runtime Details

- **Handler**: `dist/apps/server/lambda.handler`  
  The zip must have `dist/` at its root — this is why the CI packages with `cd lambda_pkg && zip -r ... .` (not `zip -r ... lambda_pkg/`).
- **Runtime**: `nodejs22.x`, `arm64` (Graviton2 — ~20% cheaper than x86)
- **Wrapper**: `@vendia/serverless-express` translates API Gateway v2 events to Express `req`/`res` objects

### Variables

| Variable | Default | Description |
|---|---|---|
| `project_name` | `deployma` | Prefix for all resource names |
| `aws_region` | `ap-southeast-2` | AWS region |
| `supabase_url` | *(required)* | Supabase project URL |
| `supabase_anon_key` | *(required)* | Supabase publishable (anon) API key |
| `allowed_origins` | `*` | CORS allowed origin — set to your CloudFront domain in production |

### Outputs

After `terraform apply`, these values are printed:

| Output | Value |
|---|---|
| `api_url` | API Gateway URL, e.g. `https://4n2hykhdn8.execute-api.ap-southeast-2.amazonaws.com` |
| `cloudfront_domain` | CloudFront domain, e.g. `d26zvumev4ucx9.cloudfront.net` |
| `cloudfront_distribution_id` | CloudFront dist ID for cache invalidation |
| `frontend_bucket` | S3 bucket name for `aws s3 sync` |

### First Deploy (local)

```bash
# 1. Build the backend
cd backend && npm run build

# 2. Package Lambda zip (files must be at root of zip)
rm -rf lambda_pkg && mkdir lambda_pkg
cp -r dist/ lambda_pkg/dist && cp package.json lambda_pkg/
cd lambda_pkg && npm install --omit=dev --ignore-scripts
zip -r ../terraform/backend.zip .
cd .. && rm -rf lambda_pkg

# 3. Initialise Terraform with remote state
cd ../terraform
terraform init \
  -backend-config="bucket=YOUR_TF_STATE_BUCKET" \
  -backend-config="region=ap-southeast-2"

# 4. Apply (will prompt for confirmation)
terraform apply \
  -var="supabase_url=https://yourproject.supabase.co" \
  -var="supabase_anon_key=YOUR_ANON_KEY" \
  -var="allowed_origins=*"

# 5. After first apply, re-apply with the real CloudFront domain
terraform apply \
  -var="supabase_url=https://yourproject.supabase.co" \
  -var="supabase_anon_key=YOUR_ANON_KEY" \
  -var="allowed_origins=https://YOUR_CLOUDFRONT_DOMAIN"
```

---

## GitHub Secrets

Add these under **Settings → Secrets and variables → Actions → Secrets** (not Variables):

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user access key with permissions for Lambda, API Gateway, S3, CloudFront, IAM |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_REGION` | AWS region, e.g. `ap-southeast-2` |
| `TF_STATE_BUCKET` | S3 bucket name storing Terraform state, e.g. `deployma-tf-state-lat` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase publishable (anon) key |
| `CLOUDFRONT_DOMAIN` | CloudFront domain without `https://`, e.g. `d26zvumev4ucx9.cloudfront.net` — set this after the first deploy |

> **Important**: all values must be in the **Secrets** tab, not the Variables tab. Variables are not masked in logs and are not injected into `${{ secrets.* }}` expressions.

---

## Troubleshooting

**Login / OAuth not working**
- Check Supabase credentials in both `.env` files
- For Google OAuth: enable Google provider in Supabase Dashboard → Authentication → Providers, add redirect URLs `http://localhost:5173/auth/callback` (local) and `https://YOUR_CLOUDFRONT_DOMAIN/auth/callback` (production), and set Site URL to your CloudFront domain

**Orders not placing / stock not updating**
- Ensure all migrations have been run, especially `20260305040000_product_stock_management.sql`
- The backend needs `SUPABASE_SERVICE_ROLE_KEY` to call protected RPCs

**Real-time not working**
- Supabase Realtime must be enabled for the `products` table — Dashboard → Database → Replication

**CORS errors from deployed frontend**
- Confirm `allowed_origins` in Terraform is set to your exact CloudFront domain (e.g. `https://d26zvumev4ucx9.cloudfront.net`), not `*`
- Re-run `terraform apply -var="allowed_origins=https://YOUR_CLOUDFRONT_DOMAIN"` if it was deployed with the wildcard default

**Lambda 500 errors (admin routes)**
- Check Lambda logs: `aws logs tail /aws/lambda/deployma-backend --since 5m --region ap-southeast-2`
- Confirm `SUPABASE_URL` is set correctly in Lambda environment (Terraform variable `supabase_url`)
- JWT verification uses the Supabase JWKS endpoint — Lambda needs outbound internet access (no VPC restriction)

**`Cannot find module 'lambda'` in Lambda logs**
- The Lambda zip was built incorrectly — files must be at the root of the zip, not inside a subdirectory
- Package with: `cd lambda_pkg && zip -r ../../terraform/backend.zip .` (note: `cd` first, then zip `.`)

---

## License

MIT