import type { Request, Response } from "express";
import httpStatus from "http-status";
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";

// Extend Express Request to include user and raw token
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

export const AuthMiddleware = async (
  req: Request,
  res: Response,
  next: () => void,
) => {
  // Allow CORS preflight through without auth check
  if (req.method === "OPTIONS") return next();

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

    // Store raw token so controllers can use createClientWithToken(req.token)
    req.token = token;

    const secret = process.env.SUPABASE_JWT_SECRET;
    let payload: any = null;

    if (secret) {
      try {
        const secretKey = new TextEncoder().encode(secret);
        const verified = await jwtVerify(token, secretKey);
        payload = verified.payload;
      } catch {
        res.status(httpStatus.UNAUTHORIZED).json({ error: "Invalid token" });
        return;
      }
    } else {
      // No secret configured — decode without verification (dev only)
      if (process.env.NODE_ENV === "production") {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Server misconfiguration: SUPABASE_JWT_SECRET not set" });
        return;
      }
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
