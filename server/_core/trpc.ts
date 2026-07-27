import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware to check if user is authenticated
const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Middleware to check for specific role
const requireRole = (allowedRoles: string[]) =>
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This feature requires one of these roles: ${allowedRoles.join(", ")}`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  });

export const protectedProcedure = t.procedure.use(requireAuth);

// Role-specific procedures
export const studentProcedure = t.procedure.use(requireRole(["student"]));
export const teacherProcedure = t.procedure.use(requireRole(["teacher"]));
export const studentOrTeacherProcedure = t.procedure.use(
  requireRole(["student", "teacher"])
);
export const adminProcedure = t.procedure.use(
  requireRole(["admin"])
);
