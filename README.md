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
SUPABASE_JWT_SECRET=your_jwt_secret
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

## Troubleshooting

**Login / OAuth not working**
- Check Supabase credentials in both `.env` files
- For Google OAuth: enable Google provider in Supabase Dashboard → Authentication → Providers, add redirect URL `http://localhost:5173/`

**Orders not placing / stock not updating**
- Ensure all migrations have been run, especially `20260305040000_product_stock_management.sql`
- The backend needs `SUPABASE_SERVICE_ROLE_KEY` to call protected RPCs

**Real-time not working**
- Supabase Realtime must be enabled for the `products` table — Dashboard → Database → Replication

---

## License

MIT

- User authentication with email/password and Google OAuth
- User session persistence (stay logged in on refresh)
- Role-based access control (Admin portal)
- Admin dashboard for managing products, orders, delivery zones, and more
- Modern, responsive UI with custom design system

## Tech Stack

### Frontend

- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Pinia** for state management
- **Vue Router** for navigation with auth guards
- **Supabase** for authentication and database
- **Vite** for fast development

### Backend

- **Node.js** with **Express**
- **TypeScript** (ES Modules)
- **Supabase** for backend services
- **tsx** for TypeScript execution

## Setup Instructions

### 1. Supabase Configuration

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable Google OAuth:
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials
   - Set redirect URL: `http://localhost:5173/`

3. Get your Supabase credentials:
   - Project URL
   - Anon Key
   - Service Role Key (for backend)

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env and fill in your Supabase credentials:
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY,
# SUPABASE_JWT_SECRET, PORT, ALLOWED_ORIGINS, ADMIN_EMAILS

# Start development server
npm run dev
```

The backend will run at `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env and fill in your Supabase credentials:
# VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL

# Start development server
npm run dev
```

The frontend will run at `http://localhost:5173`

## Usage

### User Accounts

**Regular User:**

- Sign up with any email
- Login and browse products
- Add items to cart

**Admin User:**

- Sign up with an email containing "admin" (e.g., `admin@example.com`)
- Access admin portal at `/admin`
- Manage products, orders, delivery zones, etc.

### Authentication Flow

1. **Sign Up**: Create account with email/password or Google OAuth
2. **Sign In**: Login with credentials or Google
3. **Session Persistence**: Stay logged in on browser refresh
4. **Role-Based Access**: Admin users automatically get access to admin portal

### Routes

- `/` - Homepage (grocery platform)
- `/login` - Login/Signup page
- `/admin` - Admin portal (requires admin role)
- `/about` - About page

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── apps/server/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── app.ts
│   │   │   └── start.ts
│   │   └── Contexts/Shared/infrastructure/persistence/supabase/
│   │       └── SupabaseClientFactory.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── HomeView.vue (Main grocery page)
│   │   │   ├── LoginView.vue (Auth page)
│   │   │   └── AdminView.vue (Admin portal)
│   │   ├── stores/
│   │   │   └── auth.ts (Authentication store)
│   │   ├── lib/
│   │   │   └── supabase.ts (Supabase client)
│   │   ├── router/
│   │   │   └── index.ts (Router with auth guards)
│   │   ├── App.vue
│   │   └── main.ts
│   ├── package.json
│   └── vite.config.ts
│
└── infrastructure/
```

## Key Features Explained

### Session Persistence

- Supabase automatically stores session in localStorage
- App.vue initializes auth store on mount
- Sessions persist across browser refreshes
- Auto-refreshes tokens when expired

### Role-Based Access

- Admin detection based on email containing "admin"
- Navigation guards protect admin routes
- Automatic redirect if unauthorized

### OAuth Integration

- Google OAuth configured in Supabase
- Click "Continue with Google" button
- Automatic account creation/login
- Session persisted same as email/password

## Development Commands

### Backend

```bash
npm run dev      # Start development server with watch mode
npm run start    # Start production server
```

### Frontend

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Environment Variables

### Backend (`backend/.env`)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
```

### Frontend (`frontend/.env`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=http://localhost:3000
```

## Troubleshooting

### Can't Login/Signup

- Check Supabase credentials in .env files
- Verify Supabase project is active
- Check browser console for errors

### OAuth Not Working

- Verify Google OAuth is enabled in Supabase
- Check redirect URL is correct
- Ensure using http://localhost (not 127.0.0.1)

### Session Not Persisting

- Check browser localStorage is enabled
- Verify Supabase client configuration
- Check auth store initialization in App.vue


## License

MIT
