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

    // Use the user's own JWT — RLS + is_admin() handles authorisation
    const client = SupabaseClientFactory.createClientWithToken(req.token!);

    const { data: profile, error } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || profile?.role !== "admin") {
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
