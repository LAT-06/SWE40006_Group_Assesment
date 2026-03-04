import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Database } from './SupabaseTypes.js';

// Load environment variables if not already loaded
dotenv.config();

/**
 * Supabase client factory using the anon key only (Supabase best practice).
 *
 * - createClient()             → anon key, no user context (public data)
 * - createClientWithToken(jwt) → anon key + user JWT in Authorization header
 *                                RLS policies enforce access control
 * - createServiceRoleClient()  → falls back to anon key; kept for compatibility
 *                                All service-role usage has been removed from this app.
 */
export class SupabaseClientFactory {
  private static anonClient: SupabaseClient<Database> | null = null;

  private static getUrlAndKey(): { url: string; key: string } {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url) throw new Error('SUPABASE_URL is not defined in environment variables');
    if (!key) throw new Error('SUPABASE_ANON_KEY is not defined in environment variables');
    return { url, key };
  }

  /** Anon client — use for public/unauthenticated reads. */
  static createClient(): SupabaseClient<Database> {
    if (this.anonClient) return this.anonClient;
    const { url, key } = this.getUrlAndKey();
    this.anonClient = createClient<Database>(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return this.anonClient;
  }

  /**
   * User-scoped client — passes the user's JWT so RLS policies apply.
   * Use this for any authenticated endpoint.
   */
  static createClientWithToken(token: string): SupabaseClient<Database> {
    const { url, key } = this.getUrlAndKey();
    return createClient<Database>(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /**
   * @deprecated No service role key required. Returns an anon client.
   * Kept so that any remaining call sites compile without changes.
   */
  static createServiceRoleClient(): SupabaseClient<Database> {
    return this.createClient();
  }
}
