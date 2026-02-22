import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

export const AdminMiddleware = async (
  req: Request,
  res: Response,
  next: () => void,
  ) => {
  try {
    const user = req.user;

    if (!user) {
      res
        .status(httpStatus.UNAUTHORIZED)
        .json({ error: "User not authenticated" });
      return;
    }

    const client = SupabaseClientFactory.createServiceRoleClient();
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    if (adminEmails.length === 0) {
      next();
      return;
    }
    const isAdminByMetadata = user.user_metadata?.isAdmin === true;
    const isAdminByEmail =
      typeof user.email === "string" &&
      adminEmails.includes(user.email.toLowerCase());

    // Check role in profiles table
    const { data: profile, error } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdminByProfile = !error && profile?.role === "admin";

    if (!isAdminByProfile && (isAdminByMetadata || isAdminByEmail)) {
      await client
        .from("profiles")
        .upsert(
          {
            id: user.id,
            role: "admin",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );
      next();
      return;
    }

    if (!isAdminByProfile) {
      res
        .status(httpStatus.FORBIDDEN)
        .json({ error: "Access denied: Admins only" });
      return;
    }

    next();
  } catch (error) {
    console.error("Admin Middleware Error:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal Server Error" });
  }
};
