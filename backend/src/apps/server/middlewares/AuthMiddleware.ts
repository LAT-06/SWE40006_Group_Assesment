import type { Request, Response } from "express";
import httpStatus from "http-status";
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";

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
  if (req.method === "OPTIONS") return next();
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(httpStatus.UNAUTHORIZED).json({ error: "Missing authorization header" });
      return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(httpStatus.UNAUTHORIZED).json({ error: "Missing token" });
      return;
    }
    req.token = token;
    let payload: any = null;
    const supabaseUrl = process.env.SUPABASE_URL;
    if (supabaseUrl) {
      try {
        const JWKS = createRemoteJWKSet(new URL(supabaseUrl + "/auth/v1/.well-known/jwks.json"));
        const verified = await jwtVerify(token, JWKS);
        payload = verified.payload;
      } catch {
        res.status(httpStatus.UNAUTHORIZED).json({ error: "Invalid token" });
        return;
      }
    } else {
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
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
  }
};
