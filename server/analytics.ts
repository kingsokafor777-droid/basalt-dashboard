import type {
  Control,
  DriftEvent,
  FindingObservation,
  ScanRun,
} from "../drizzle/schema";

export type WarehouseSnapshot = {
  controls: Control[];
  driftEvents: DriftEvent[];
  findingObservations: FindingObservation[];
  scanRuns: ScanRun[];
};

export type FindingSortBy =
  | "severity"
  | "scanner"
  | "controlId"
  | "resource"
  | "status"
  | "firstSeen"
  | "lastSeen";
export type SortDirection = "asc" | "desc";

const frameworks = ["cis-aws", "cis-azure", "cis-k8s"] as const;
const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 } as const;

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function percent(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

export function dashboardStats(snapshot: WarehouseSnapshot) {
  const findings = snapshot.findingObservations;
  const severity = findings.reduce(
    (result, finding) => {
      result[finding.severity] += 1;
      return result;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );
  const openFindings = findings.filter(
    finding => finding.status === "open"
  ).length;
  const resolvedFindings = findings.length - openFindings;
  const completeScans = snapshot.scanRuns.filter(
    run => run.status === "complete"
  ).length;
  const cleanScans = snapshot.scanRuns.filter(
    run => run.errorCount === 0
  ).length;

  return {
    totalFindings: findings.length,
    severity,
    openFindings,
    resolvedFindings,
    openRatio: percent(openFindings, findings.length),
    scanHealthScore: Math.round(
      percent(completeScans, snapshot.scanRuns.length) * 0.65 +
        percent(cleanScans, snapshot.scanRuns.length) * 0.35
    ),
    lastScanAt: snapshot.scanRuns.reduce<Date | null>(
      (latest, run) =>
        !latest || run.completedAt > latest ? run.completedAt : latest,
      null
    ),
  };
}

export function riskTrendSeries(snapshot: WarehouseSnapshot) {
  const lastEventAt = snapshot.driftEvents.reduce<Date | null>(
    (latest, event) =>
      !latest || event.occurredAt > latest ? event.occurredAt : latest,
    null
  );
  if (!lastEventAt) return [];

  const rows = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(lastEventAt);
    date.setUTCDate(date.getUTCDate() - 29 + index);
    return { date: dateKey(date), new: 0, resolved: 0, regressed: 0 };
  });
  const rowByDate = new Map(rows.map(row => [row.date, row]));
  snapshot.driftEvents.forEach(event => {
    const row = rowByDate.get(dateKey(event.occurredAt));
    if (row) row[event.eventType] += 1;
  });
  return rows;
}

export function controlCoverage(snapshot: WarehouseSnapshot) {
  return frameworks.map(framework => {
    const controls = snapshot.controls.filter(
      control => control.framework === framework
    );
    const passing = controls.filter(
      control => control.currentStatus === "pass"
    ).length;
    const failing = controls.length - passing;
    return {
      framework,
      passing,
      failing,
      total: controls.length,
      coverage: percent(passing, controls.length),
      controls: controls
        .slice()
        .sort((left, right) => left.id.localeCompare(right.id))
        .map(control => ({
          id: control.id,
          title: control.title,
          provider: control.provider,
          status: control.currentStatus,
          severity: control.defaultSeverity,
          lastEvaluatedAt: control.lastEvaluatedAt,
        })),
    };
  });
}

export function complianceSnapshot(
  snapshot: WarehouseSnapshot,
  provider = "all",
  scanner = "all"
) {
  const scannerControlIds = new Set(
    snapshot.findingObservations
      .filter(finding => scanner === "all" || finding.scanner === scanner)
      .map(finding => finding.controlId)
  );
  const selectedControls = snapshot.controls.filter(
    control =>
      (provider === "all" || control.provider === provider) &&
      (scanner === "all" || scannerControlIds.has(control.id))
  );
  return {
    provider,
    frameworks: frameworks.map(framework => {
      const controls = selectedControls.filter(
        control => control.framework === framework
      );
      const passing = controls.filter(
        control => control.currentStatus === "pass"
      ).length;
      return {
        framework,
        score: percent(passing, controls.length),
        passing,
        failing: controls.length - passing,
        total: controls.length,
      };
    }),
    controls: selectedControls
      .slice()
      .sort(
        (left, right) =>
          left.framework.localeCompare(right.framework) ||
          left.id.localeCompare(right.id)
      )
      .map(control => ({
        id: control.id,
        framework: control.framework,
        provider: control.provider,
        title: control.title,
        status: control.currentStatus,
        severity: control.defaultSeverity,
      })),
  };
}

export function findingPage(
  snapshot: WarehouseSnapshot,
  input: {
    page: number;
    pageSize: number;
    severity?: string;
    scanner?: string;
    provider?: string;
    status?: string;
    search?: string;
    sortBy: FindingSortBy;
    sortDirection: SortDirection;
  }
) {
  const controlsById = new Map(
    snapshot.controls.map(control => [control.id, control])
  );
  const search = input.search?.trim().toLowerCase();
  const filtered = snapshot.findingObservations.filter(finding => {
    if (
      input.severity &&
      input.severity !== "all" &&
      finding.severity !== input.severity
    )
      return false;
    if (
      input.scanner &&
      input.scanner !== "all" &&
      finding.scanner !== input.scanner
    )
      return false;
    if (
      input.provider &&
      input.provider !== "all" &&
      finding.provider !== input.provider
    )
      return false;
    if (
      input.status &&
      input.status !== "all" &&
      finding.status !== input.status
    )
      return false;
    if (!search) return true;
    return [
      finding.title,
      finding.controlId,
      finding.resourceName,
      finding.resourceUrn,
      finding.scanner,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });

  const sorted = filtered.slice().sort((left, right) => {
    const direction = input.sortDirection === "asc" ? 1 : -1;
    const values: Record<FindingSortBy, [string | number, string | number]> = {
      severity: [severityWeight[left.severity], severityWeight[right.severity]],
      scanner: [left.scanner, right.scanner],
      controlId: [left.controlId, right.controlId],
      resource: [left.resourceName, right.resourceName],
      status: [left.status, right.status],
      firstSeen: [left.firstSeenAt.getTime(), right.firstSeenAt.getTime()],
      lastSeen: [left.lastSeenAt.getTime(), right.lastSeenAt.getTime()],
    };
    const [leftValue, rightValue] = values[input.sortBy];
    if (typeof leftValue === "number" && typeof rightValue === "number")
      return (leftValue - rightValue) * direction;
    return String(leftValue).localeCompare(String(rightValue)) * direction;
  });
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / input.pageSize));
  const page = Math.min(Math.max(1, input.page), pageCount);

  return {
    page,
    pageSize: input.pageSize,
    total,
    pageCount,
    items: sorted
      .slice((page - 1) * input.pageSize, page * input.pageSize)
      .map(finding => ({
        ...finding,
        framework: controlsById.get(finding.controlId)?.framework ?? "unknown",
      })),
  };
}

export function executiveSummary(snapshot: WarehouseSnapshot) {
  const coverage = controlCoverage(snapshot);
  const stats = dashboardStats(snapshot);
  const trend = riskTrendSeries(snapshot);
  const topCriticalFindings = snapshot.findingObservations
    .filter(
      finding => finding.status === "open" && finding.severity === "critical"
    )
    .slice()
    .sort((left, right) => right.riskScore - left.riskScore)
    .slice(0, 5)
    .map(finding => ({
      id: finding.id,
      title: finding.title,
      resourceName: finding.resourceName,
      scanner: finding.scanner,
      riskScore: finding.riskScore,
      controlId: finding.controlId,
    }));
  const weightedExposure = snapshot.findingObservations
    .filter(finding => finding.status === "open")
    .reduce((sum, finding) => sum + severityWeight[finding.severity] * 4, 0);
  const averageCompliance = Math.round(
    coverage.reduce((sum, framework) => sum + framework.coverage, 0) /
      coverage.length
  );
  const complianceDeficit = 100 - averageCompliance;
  const postureScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        Math.round(complianceDeficit * 0.55) -
        Math.round(weightedExposure / 5)
    )
  );
  const concentration = topCriticalFindings[0]?.scanner ?? "the environment";

  return {
    generatedAt: stats.lastScanAt,
    postureScore,
    stats,
    compliance: coverage.map(item => ({
      framework: item.framework,
      score: item.coverage,
    })),
    topCriticalFindings,
    postureTrend: trend.slice(-10).map(point => ({
      date: point.date,
      score: Math.max(
        0,
        postureScore - point.new * 2 + point.resolved * 2 - point.regressed * 3
      ),
    })),
    riskNarrative: `Current posture is constrained by ${stats.severity.critical} critical and ${stats.severity.high} high-severity open findings. The most concentrated critical exposure is reported by ${concentration}; remediation should first eliminate public data exposure, privileged access, and unrestricted administrative paths while sustaining the current scan-health score of ${stats.scanHealthScore}%.`,
  };
}
