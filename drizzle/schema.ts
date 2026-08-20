import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** The single authorized Basalt tenant for this deployment, extensible without changing analytics contracts. */
export const organizations = mysqlTable(
  "organizations",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    slug: varchar("slug", { length: 96 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("organizations_slug_unique").on(table.slug)]
);

/** Explicit user-to-organization grants. Dashboard analytics are inaccessible without a grant. */
export const organizationMembers = mysqlTable(
  "organization_members",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: varchar("organizationId", { length: 64 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["owner", "analyst", "viewer"])
      .default("viewer")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("organization_members_user_org_unique").on(
      table.userId,
      table.organizationId
    ),
    index("organization_members_org_idx").on(table.organizationId),
  ]
);

/** Completed scanner executions ingested from the Basalt warehouse contract. */
export const scanRuns = mysqlTable(
  "scan_runs",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    scanner: varchar("scanner", { length: 64 }).notNull(),
    scannerVersion: varchar("scannerVersion", { length: 32 }).notNull(),
    provider: varchar("provider", { length: 32 }).notNull(),
    scopeKey: varchar("scopeKey", { length: 160 }).notNull(),
    status: mysqlEnum("status", [
      "complete",
      "completed_with_errors",
    ]).notNull(),
    startedAt: timestamp("startedAt").notNull(),
    completedAt: timestamp("completedAt").notNull(),
    checksRun: int("checksRun").notNull(),
    findingCount: int("findingCount").notNull(),
    errorCount: int("errorCount").notNull().default(0),
  },
  table => [
    index("scan_runs_completed_at_idx").on(table.completedAt),
    index("scan_runs_provider_idx").on(table.provider),
  ]
);

/** Canonical controls from the Basalt control catalogue, with their latest evaluated state. */
export const controls = mysqlTable(
  "controls",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    framework: mysqlEnum("framework", [
      "cis-aws",
      "cis-azure",
      "cis-k8s",
    ]).notNull(),
    provider: varchar("provider", { length: 32 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    defaultSeverity: mysqlEnum("defaultSeverity", [
      "critical",
      "high",
      "medium",
      "low",
    ]).notNull(),
    currentStatus: mysqlEnum("currentStatus", ["pass", "fail"]).notNull(),
    lastEvaluatedAt: timestamp("lastEvaluatedAt").notNull(),
  },
  table => [index("controls_framework_idx").on(table.framework, table.provider)]
);

/** Immutable latest finding observations aligned to Basalt's normalized finding shape. */
export const findingObservations = mysqlTable(
  "finding_observations",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    scanId: varchar("scanId", { length: 64 })
      .notNull()
      .references(() => scanRuns.id, { onDelete: "cascade" }),
    fingerprint: varchar("fingerprint", { length: 128 }).notNull(),
    controlId: varchar("controlId", { length: 128 })
      .notNull()
      .references(() => controls.id),
    scanner: varchar("scanner", { length: 64 }).notNull(),
    provider: varchar("provider", { length: 32 }).notNull(),
    severity: mysqlEnum("severity", [
      "critical",
      "high",
      "medium",
      "low",
    ]).notNull(),
    riskScore: int("riskScore").notNull(),
    status: mysqlEnum("status", ["open", "resolved"]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    resourceUrn: varchar("resourceUrn", { length: 512 }).notNull(),
    resourceName: varchar("resourceName", { length: 255 }).notNull(),
    resourceType: varchar("resourceType", { length: 128 }).notNull(),
    account: varchar("account", { length: 128 }).notNull(),
    region: varchar("region", { length: 64 }).notNull(),
    remediation: text("remediation").notNull(),
    firstSeenAt: timestamp("firstSeenAt").notNull(),
    lastSeenAt: timestamp("lastSeenAt").notNull(),
    observedAt: timestamp("observedAt").notNull(),
  },
  table => [
    uniqueIndex("finding_observations_scan_fingerprint_idx").on(
      table.scanId,
      table.fingerprint
    ),
    index("finding_observations_status_severity_idx").on(
      table.status,
      table.severity
    ),
    index("finding_observations_provider_idx").on(table.provider),
    index("finding_observations_control_idx").on(table.controlId),
  ]
);

/** State changes between consecutive scans, used for trend and regression analysis. */
export const driftEvents = mysqlTable(
  "drift_events",
  {
    id: varchar("id", { length: 96 }).primaryKey(),
    scanId: varchar("scanId", { length: 64 })
      .notNull()
      .references(() => scanRuns.id, { onDelete: "cascade" }),
    findingFingerprint: varchar("findingFingerprint", {
      length: 128,
    }).notNull(),
    controlId: varchar("controlId", { length: 128 })
      .notNull()
      .references(() => controls.id),
    scanner: varchar("scanner", { length: 64 }).notNull(),
    provider: varchar("provider", { length: 32 }).notNull(),
    severity: mysqlEnum("severity", [
      "critical",
      "high",
      "medium",
      "low",
    ]).notNull(),
    eventType: mysqlEnum("eventType", [
      "new",
      "resolved",
      "regressed",
    ]).notNull(),
    occurredAt: timestamp("occurredAt").notNull(),
  },
  table => [
    index("drift_events_occurred_at_idx").on(table.occurredAt),
    index("drift_events_provider_idx").on(table.provider),
  ]
);

export type ScanRun = typeof scanRuns.$inferSelect;
export type Control = typeof controls.$inferSelect;
export type FindingObservation = typeof findingObservations.$inferSelect;
export type DriftEvent = typeof driftEvents.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
