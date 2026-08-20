import {
  controls,
  driftEvents,
  findingObservations,
  scanRuns,
} from "../drizzle/schema";
import type { WarehouseSnapshot } from "./analytics";
import { ensureWarehouseSeeded, getDb } from "./db";
import { ENV } from "./_core/env";
import { warehouseSnapshotEnvelope } from "./warehouseContract";

export function warehouseSnapshotUrl(
  baseUrl: string,
  organizationId: string
): string {
  return `${baseUrl.replace(/\/$/, "")}/v1/organizations/${encodeURIComponent(organizationId)}/dashboard-snapshot`;
}

export function usesLocalWarehouseFallback(options: {
  isProduction: boolean;
  warehouseReadUrl: string;
}): boolean {
  return !options.isProduction && !options.warehouseReadUrl;
}

async function loadLocalDevelopmentSnapshot(): Promise<WarehouseSnapshot> {
  await ensureWarehouseSeeded();
  const db = await getDb();
  if (!db) throw new Error("Basalt warehouse database is unavailable");

  const [controlRows, eventRows, findingRows, scanRows] = await Promise.all([
    db.select().from(controls),
    db.select().from(driftEvents),
    db.select().from(findingObservations),
    db.select().from(scanRuns),
  ]);

  return {
    controls: controlRows,
    driftEvents: eventRows,
    findingObservations: findingRows,
    scanRuns: scanRows,
  };
}

async function loadRemoteWarehouseSnapshot(
  organizationId: string
): Promise<WarehouseSnapshot> {
  const response = await fetch(
    warehouseSnapshotUrl(ENV.warehouseReadUrl, organizationId),
    {
      headers: {
        Accept: "application/json",
        ...(ENV.warehouseReadToken
          ? { Authorization: `Bearer ${ENV.warehouseReadToken}` }
          : {}),
      },
      signal: AbortSignal.timeout(8_000),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Basalt Warehouse snapshot request failed with HTTP ${response.status}.`
    );
  }

  const body: unknown = await response.json();
  return warehouseSnapshotEnvelope.parse(body).snapshot;
}

/**
 * Loads an organization-scoped Warehouse snapshot. Production never seeds or serves local
 * data: it requires the versioned Warehouse read endpoint and fails closed if absent.
 */
export async function loadWarehouseSnapshot(
  organizationId: string
): Promise<WarehouseSnapshot> {
  if (usesLocalWarehouseFallback(ENV)) return loadLocalDevelopmentSnapshot();

  if (!ENV.warehouseReadUrl) {
    throw new Error(
      "BASALT_WAREHOUSE_READ_URL is required for production dashboard analytics."
    );
  }

  return loadRemoteWarehouseSnapshot(organizationId);
}
