import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export class UserRoleUpdateController {
  async run(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { role } = req.body;

      if (!id) {
        res.status(httpStatus.BAD_REQUEST).json({ error: "User ID is required" });
        return;
      }

      if (!["customer", "admin"].includes(role)) {
        res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "Role must be 'customer' or 'admin'" });
        return;
      }

      // Prevent an admin from demoting themselves
      if (req.user?.id === id && role !== "admin") {
        res
          .status(httpStatus.FORBIDDEN)
          .json({ error: "You cannot change your own role" });
        return;
      }

      const client = SupabaseClientFactory.createClientWithToken(req.token!);

      const { error } = await client
        .from("profiles")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: error.message });
        return;
      }

      res.status(httpStatus.OK).json({ id, role });
    } catch (err: any) {
      console.error("UserRoleUpdateController error:", err);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Failed to update user role" });
    }
  }
}
