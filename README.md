# Deployma - Grocery Delivery Platform

A full-stack grocery delivery platform built with Vue.js, TypeScript, Express, and Supabase.

## Features

- Browse and shop for groceries
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

## Next Steps

- Implement product catalog with real data
- Add shopping cart functionality
- Integrate payment processing
- Build out full admin management features
- Add order tracking
- Implement delivery scheduling

## License

MIT
