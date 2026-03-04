import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class UserListController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      // Use anon key + admin JWT — is_admin() RLS on profiles allows admin reads
      const client = SupabaseClientFactory.createClientWithToken(req.token!);

      const { data: profiles, error } = await client
        .from("profiles")
        .select("id, full_name, avatar_url, email, role, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) {
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: error.message });
        return;
      }

      const users = (profiles ?? []).map((p) => ({
        id: p.id,
        email: (p as any).email ?? null,
        full_name: p.full_name ?? null,
        avatar_url: p.avatar_url ?? null,
        role: p.role ?? "customer",
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));

      // Sort newest first
      users.sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime(),
      );

      res.status(httpStatus.OK).json({ users, total: users.length });
    } catch (err: any) {
      console.error("UserListController error:", err);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Failed to fetch users" });
    }
  }
}
