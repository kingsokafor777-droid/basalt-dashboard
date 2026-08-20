import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildWarehouseSeed } from "./warehouseSeed";

const originalEnvironment = { ...process.env };

async function loadWarehouseModule(options: {
  production?: boolean;
  readUrl?: string;
  readToken?: string;
} = {}) {
  vi.resetModules();
  process.env.NODE_ENV = options.production ? "production" : "test";
  process.env.BASALT_WAREHOUSE_READ_URL = options.readUrl ?? "";
  process.env.BASALT_WAREHOUSE_READ_TOKEN = options.readToken ?? "";
  return import("./warehouse");
}

describe("Warehouse read adapter", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnvironment };
  });

  it("constructs a tenant-scoped, versioned snapshot endpoint", async () => {
    const { warehouseSnapshotUrl } = await import("./warehouse");
    expect(warehouseSnapshotUrl("https://warehouse.internal/", "basalt platform")).toBe(
      "https://warehouse.internal/v1/organizations/basalt%20platform/dashboard-snapshot"
    );
  });

  it("allows the deterministic snapshot only outside production and only without an endpoint", async () => {
    const { usesLocalWarehouseFallback } = await import("./warehouse");
    expect(
      usesLocalWarehouseFallback({
        isProduction: false,
        warehouseReadUrl: "",
      })
    ).toBe(true);
    expect(
      usesLocalWarehouseFallback({
        isProduction: true,
        warehouseReadUrl: "",
      })
    ).toBe(false);
    expect(
      usesLocalWarehouseFallback({
        isProduction: false,
        warehouseReadUrl: "https://warehouse.internal",
      })
    ).toBe(false);
  });

  it("loads and validates the remote tenant snapshot with a bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          contractVersion: "basalt.dashboard.snapshot.v1",
          snapshot: buildWarehouseSeed(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    const { loadWarehouseSnapshot } = await loadWarehouseModule({
      production: true,
      readUrl: "https://warehouse.internal/",
      readToken: "read-token",
    });

    const snapshot = await loadWarehouseSnapshot("basalt");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://warehouse.internal/v1/organizations/basalt/dashboard-snapshot",
      expect.objectContaining({
        headers: {
          Accept: "application/json",
          Authorization: "Bearer read-token",
        },
      })
    );
    expect(snapshot.scanRuns[0]?.completedAt).toBeInstanceOf(Date);
    expect(snapshot.findingObservations).not.toHaveLength(0);
  });

  it("fails closed when production has no configured Warehouse read endpoint", async () => {
    const { loadWarehouseSnapshot } = await loadWarehouseModule({
      production: true,
    });

    await expect(loadWarehouseSnapshot("basalt")).rejects.toThrow(
      "BASALT_WAREHOUSE_READ_URL is required"
    );
  });

  it("rejects failed responses and invalid Warehouse snapshot contracts", async () => {
    const { loadWarehouseSnapshot } = await loadWarehouseModule({
      production: true,
      readUrl: "https://warehouse.internal",
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(loadWarehouseSnapshot("basalt")).rejects.toThrow(
      "HTTP 503"
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            contractVersion: "unsupported.contract.v0",
            snapshot: {},
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    await expect(loadWarehouseSnapshot("basalt")).rejects.toThrow();
  });
});
