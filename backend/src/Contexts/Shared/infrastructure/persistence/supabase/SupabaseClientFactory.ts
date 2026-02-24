import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Database } from './SupabaseTypes.js';

// Load environment variables if not already loaded
dotenv.config();

export class SupabaseClientFactory {
  private static client: SupabaseClient<Database> | null = null;
  private static serviceClient: SupabaseClient<Database> | null = null;

  static createClient(): SupabaseClient<Database> {
    if (this.client) return this.client;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not defined in the environment variables');
    }

    if (!supabaseKey) {
      throw new Error('SUPABASE_KEY (Service Role or Anon) is not defined in the environment variables');
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    return this.client;
  }

  static createServiceRoleClient(): SupabaseClient<Database> {
    if (this.serviceClient) return this.serviceClient;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not defined in the environment variables');
    }

    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in the environment variables');
    }

    this.serviceClient = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    return this.serviceClient;
  }

  static createClientWithToken(token: string): SupabaseClient<Database> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL or SUPABASE_KEY is not defined');
    }

    return createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false }
    });
  }
}
