# Deployma — Frontend

Vue 3 + TypeScript frontend for the Deployma grocery delivery platform.

## Tech Stack

- **Vue 3** with Composition API
- **TypeScript**
- **Pinia** for state management
- **Vue Router** with auth guards
- **Supabase** for authentication
- **Vite** for development and build

## Setup

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env

# Start development server
npm run dev
```

The app will run at `http://localhost:5173`.

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |
| `VITE_API_URL` | Backend API URL (default: `http://localhost:3000`) |

## Commands

```bash
npm run dev          # Start development server
npm run build        # Type-check and build for production
npm run preview      # Preview production build
npm run test:unit    # Run unit tests with Vitest
```

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
