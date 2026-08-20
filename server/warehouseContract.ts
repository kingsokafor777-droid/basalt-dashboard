import { z } from "zod";

const timestamp = z.union([z.date(), z.string().datetime({ offset: true })]).transform(value =>
  value instanceof Date ? value : new Date(value)
);

const severity = z.enum(["critical", "high", "medium", "low"]);
const provider = z.string().min(1).max(32);

const control = z.object({
  id: z.string().min(1).max(128),
  framework: z.enum(["cis-aws", "cis-azure", "cis-k8s"]),
  provider,
  title: z.string().min(1).max(255),
  description: z.string(),
  defaultSeverity: severity,
  currentStatus: z.enum(["pass", "fail"]),
  lastEvaluatedAt: timestamp,
});

const scanRun = z.object({
  id: z.string().min(1).max(64),
  scanner: z.string().min(1).max(64),
  scannerVersion: z.string().min(1).max(32),
  provider,
  scopeKey: z.string().min(1).max(160),
  status: z.enum(["complete", "completed_with_errors"]),
  startedAt: timestamp,
  completedAt: timestamp,
  checksRun: z.number().int().nonnegative(),
  findingCount: z.number().int().nonnegative(),
  errorCount: z.number().int().nonnegative(),
});

const findingObservation = z.object({
  id: z.string().min(1).max(64),
  scanId: z.string().min(1).max(64),
  fingerprint: z.string().min(1).max(128),
  controlId: z.string().min(1).max(128),
  scanner: z.string().min(1).max(64),
  provider,
  severity,
  riskScore: z.number().int(),
  status: z.enum(["open", "resolved"]),
  title: z.string().min(1).max(255),
  description: z.string(),
  resourceUrn: z.string().min(1).max(512),
  resourceName: z.string().min(1).max(255),
  resourceType: z.string().min(1).max(128),
  account: z.string().min(1).max(128),
  region: z.string().min(1).max(64),
  remediation: z.string(),
  firstSeenAt: timestamp,
  lastSeenAt: timestamp,
  observedAt: timestamp,
});

const driftEvent = z.object({
  id: z.string().min(1).max(96),
  scanId: z.string().min(1).max(64),
  findingFingerprint: z.string().min(1).max(128),
  controlId: z.string().min(1).max(128),
  scanner: z.string().min(1).max(64),
  provider,
  severity,
  eventType: z.enum(["new", "resolved", "regressed"]),
  occurredAt: timestamp,
});

export const warehouseSnapshotEnvelope = z.object({
  contractVersion: z.literal("basalt.dashboard.snapshot.v1"),
  snapshot: z.object({
    controls: z.array(control),
    driftEvents: z.array(driftEvent),
    findingObservations: z.array(findingObservation),
    scanRuns: z.array(scanRun),
  }),
});
