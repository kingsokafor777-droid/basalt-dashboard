import {
  controls,
  driftEvents,
  findingObservations,
  scanRuns,
} from "../drizzle/schema";
import type { WarehouseSnapshot } from "./analytics";
import { ensureWarehouseSeeded, getDb } from "./db";

/** Loads a consistent warehouse snapshot after provisioning the deterministic local/demo dataset. */
export async function loadWarehouseSnapshot(): Promise<WarehouseSnapshot> {
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
