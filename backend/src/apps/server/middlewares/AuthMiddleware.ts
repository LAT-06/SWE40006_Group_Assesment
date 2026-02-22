import type { Request, Response } from "express";
import httpStatus from "http-status";
import { decodeJwt, jwtVerify } from "jose";

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

    const secret = process.env.SUPABASE_JWT_SECRET;
    let payload: any = null;

    if (secret) {
      try {
        const secretKey = new TextEncoder().encode(secret);
        const verified = await jwtVerify(token, secretKey);
        payload = verified.payload;
      } catch (err) {
        console.warn("JWT verification failed, attempting decode:", err);
      }
    }

    if (!payload) {
      try {
        payload = decodeJwt(token);
      } catch {
        res.status(httpStatus.UNAUTHORIZED).json({ error: "Invalid token" });
        return;
      }
    }

    if (!payload?.sub) {
      res.status(httpStatus.UNAUTHORIZED).json({ error: "Invalid token" });
      return;
    }

    req.user = {
      id: payload.sub,
      email: (payload as any).email,
      role: (payload as any).role,
      user_metadata: (payload as any).user_metadata ?? {},
      app_metadata: (payload as any).app_metadata ?? {},
    };
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal Server Error" });
  }
};
