import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { organizationMembers, organizations } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { ENV } from "./_core/env";
import { protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

export type TenantAccess = {
  organizationId: string;
  organizationSlug: string;
  membershipRole: "owner" | "analyst" | "viewer";
};

async function provisionOwnerMembership(
  user: AuthenticatedUser
): Promise<TenantAccess> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "The Basalt authorization store is unavailable.",
    });
  }

  const organizationId = ENV.basaltOrganizationId;
  await db.transaction(async tx => {
    await tx
      .insert(organizations)
      .values({
        id: organizationId,
        slug: organizationId,
        name: "Basalt Security",
      })
      .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    await tx
      .insert(organizationMembers)
      .values({ organizationId, userId: user.id, role: "owner" })
      .onDuplicateKeyUpdate({ set: { role: "owner" } });
  });

  return {
    organizationId,
    organizationSlug: organizationId,
    membershipRole: "owner",
  };
}

export async function resolveTenantAccess(
  user: AuthenticatedUser
): Promise<TenantAccess> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "The Basalt authorization store is unavailable.",
    });
  }

  const membership = await db
    .select({
      organizationId: organizations.id,
      organizationSlug: organizations.slug,
      membershipRole: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(
      organizations,
      eq(organizationMembers.organizationId, organizations.id)
    )
    .where(
      and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.organizationId, ENV.basaltOrganizationId)
      )
    )
    .limit(1);

  if (membership[0]) return membership[0];

  if (ENV.ownerOpenId && user.openId === ENV.ownerOpenId) {
    return provisionOwnerMembership(user);
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You are not a member of the Basalt organization.",
  });
}

/** Analytics requires both a valid session and an explicit Basalt organization membership. */
export const tenantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const tenant = await resolveTenantAccess(ctx.user);
  return next({
    ctx: {
      ...ctx,
      tenant,
    },
  });
});
