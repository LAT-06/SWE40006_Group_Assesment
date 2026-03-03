#!/bin/sh

supabase gen types --lang typescript --linked > ./backend/src/Contexts/Shared/infrastructure/persistence/supabase/SupabaseTypes.ts
supabase gen types --lang typescript --linked > ./frontend/src/lib/models.ts
