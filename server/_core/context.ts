import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import jwt from "jsonwebtoken";

// User shape from website JWT
export type TrpcUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: "student" | "teacher" | "admin" | "parent" | "staff" | "superadmin" | "guest";
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: TrpcUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: TrpcUser | null = null;

  try {
    // Extract JWT from Authorization header
    const authHeader = opts.req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7); // Remove "Bearer " prefix

      // Decode JWT without verification (trust website's token)
      // In production, you might want to verify the signature if you have the website's public key
      const decoded = jwt.decode(token) as any;

      if (decoded && decoded.id && decoded.role) {
        user = {
          id: decoded.id || decoded._id,
          name: decoded.name || null,
          email: decoded.email || null,
          role: decoded.role || "guest",
        };
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures
    console.error("[Auth] Error decoding JWT:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
