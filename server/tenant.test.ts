import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getDb = vi.hoisted(() => vi.fn());

vi.mock("./db", () => ({ getDb }));

const member = {
  id: 1,
  openId: "member-user",
  email: "member@example.com",
  name: "Member",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function membershipSelect(rows: unknown[]) {
  return {
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({ limit: async () => rows }),
        }),
      }),
    }),
  };
}

describe("tenant membership enforcement", () => {
  beforeEach(() => {
    vi.resetModules();
    getDb.mockReset();
    process.env.BASALT_ORGANIZATION_ID = "basalt";
    process.env.OWNER_OPEN_ID = "platform-owner";
  });

  it("allows a user with an explicit Basalt organization membership", async () => {
    getDb.mockResolvedValue(
      membershipSelect([
        {
          organizationId: "basalt",
          organizationSlug: "basalt",
          membershipRole: "analyst",
        },
      ])
    );
    const { resolveTenantAccess } = await import("./tenant");

    await expect(resolveTenantAccess(member)).resolves.toEqual({
      organizationId: "basalt",
      organizationSlug: "basalt",
      membershipRole: "analyst",
    });
  });

  it("rejects an authenticated user who has no Basalt organization membership", async () => {
    getDb.mockResolvedValue(membershipSelect([]));
    const { resolveTenantAccess } = await import("./tenant");

    await expect(resolveTenantAccess(member)).rejects.toMatchObject({
      code: "FORBIDDEN",
    } satisfies Partial<TRPCError>);
  });

  it("bootstraps only the configured owner into the default Basalt organization", async () => {
    const onDuplicateKeyUpdate = vi.fn();
    const values = vi.fn(() => ({ onDuplicateKeyUpdate }));
    const insert = vi.fn(() => ({ values }));
    const transaction = vi.fn(async callback => callback({ insert }));
    getDb.mockResolvedValue({ ...membershipSelect([]), transaction });
    const { resolveTenantAccess } = await import("./tenant");

    await expect(
      resolveTenantAccess({ ...member, openId: "platform-owner" })
    ).resolves.toEqual({
      organizationId: "basalt",
      organizationSlug: "basalt",
      membershipRole: "owner",
    });
    expect(transaction).toHaveBeenCalledOnce();
    expect(insert).toHaveBeenCalledTimes(2);
    expect(values).toHaveBeenNthCalledWith(1, {
      id: "basalt",
      slug: "basalt",
      name: "Basalt Security",
    });
    expect(values).toHaveBeenNthCalledWith(2, {
      organizationId: "basalt",
      userId: 1,
      role: "owner",
    });
  });
});
