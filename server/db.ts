import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  controls,
  driftEvents,
  findingObservations,
  InsertUser,
  scanRuns,
  users,
} from "../drizzle/schema";
import { buildWarehouseSeed } from "./warehouseSeed";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/** Inserts the fixed portfolio data only when a warehouse snapshot has not yet been provisioned. */
export async function ensureWarehouseSeeded(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Basalt warehouse database is unavailable");

  const existing = await db.select({ id: scanRuns.id }).from(scanRuns).limit(1);
  if (existing.length > 0) return;

  const seed = buildWarehouseSeed();
  await db.transaction(async tx => {
    await tx
      .insert(controls)
      .values(seed.controls)
      .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    await tx
      .insert(scanRuns)
      .values(seed.scanRuns)
      .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    await tx
      .insert(findingObservations)
      .values(seed.findingObservations)
      .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    await tx
      .insert(driftEvents)
      .values(seed.driftEvents)
      .onDuplicateKeyUpdate({ set: { id: sql`id` } });
  });
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  try {
    await db
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}
