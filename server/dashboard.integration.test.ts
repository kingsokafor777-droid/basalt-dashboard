import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { buildWarehouseSeed } from "./warehouseSeed";

const getDb = vi.hoisted(() => vi.fn());
const loadWarehouseSnapshot = vi.hoisted(() => vi.fn());

vi.mock("./db", () => ({ getDb }));
vi.mock("./warehouse", () => ({ loadWarehouseSnapshot }));

function membershipDb() {
  return {
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            limit: async () => [
              {
                organizationId: "basalt",
                organizationSlug: "basalt",
                membershipRole: "viewer" as const,
              },
            ],
          }),
        }),
      }),
    }),
  };
}

function authenticatedContext(): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "authorized-viewer",
      email: "viewer@example.com",
      name: "Viewer",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("tenant-scoped dashboard integration", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.BASALT_ORGANIZATION_ID = "basalt";
    process.env.OWNER_OPEN_ID = "platform-owner";
    getDb.mockResolvedValue(membershipDb());
    loadWarehouseSnapshot.mockResolvedValue(buildWarehouseSeed());
  });

  it("returns analytics only after resolving the member tenant and passes its id to Warehouse", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(authenticatedContext());

    const overview = await caller.dashboard.overview();

    expect(loadWarehouseSnapshot).toHaveBeenCalledWith("basalt");
    expect(overview.totalFindings).toBeGreaterThan(0);
    expect(overview.lastScanAt).toBeInstanceOf(Date);
  });
});
