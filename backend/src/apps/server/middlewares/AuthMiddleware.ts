import type { Request, Response } from "express";
import httpStatus from "http-status";
import { SupabaseClientFactory } from "../../../Contexts/Shared/infrastructure/persistence/supabase/SupabaseClientFactory.js";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const AuthMiddleware = async (
  req: Request,
  res: Response,
  next: () => void,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res
        .status(httpStatus.UNAUTHORIZED)
        .json({ error: "Missing authorization header" });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(httpStatus.UNAUTHORIZED).json({ error: "Missing token" });
      return;
    }

    const client = SupabaseClientFactory.createClient();
    const {
      data: { user },
      error,
    } = await client.auth.getUser(token);

    if (error || !user) {
      res.status(httpStatus.UNAUTHORIZED).json({ error: "Invalid token" });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal Server Error" });
  }
};
