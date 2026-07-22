import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { IUser } from "../models";
import { sdk } from "./sdk";

// User shape for tRPC context — minimal fields needed by the app
export type TrpcUser = {
  id: string;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
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
    const authUser = await sdk.authenticateRequest(opts.req);
    // Normalize MongoDB user to the shape expected by tRPC procedures
    user = {
      id: authUser._id.toString(),
      openId: authUser.openId,
      name: authUser.name,
      email: authUser.email,
      loginMethod: authUser.loginMethod,
      role: authUser.role,
      createdAt: authUser.createdAt,
      updatedAt: authUser.updatedAt,
      lastSignedIn: authUser.lastSignedIn,
    };
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
