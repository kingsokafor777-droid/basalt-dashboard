import { describe, expect, it } from "vitest";
import {
  complianceSnapshot,
  controlCoverage,
  dashboardStats,
  executiveSummary,
  findingPage,
  riskTrendSeries,
  type WarehouseSnapshot,
} from "./analytics";
import { buildWarehouseSeed } from "./warehouseSeed";

function snapshot(): WarehouseSnapshot {
  return buildWarehouseSeed() as unknown as WarehouseSnapshot;
}

describe("Basalt warehouse analytics", () => {
  it("derives summary KPIs from the persisted finding and scan records", () => {
    const result = dashboardStats(snapshot());
    expect(result).toMatchObject({
      totalFindings: 16,
      severity: { critical: 5, high: 5, medium: 5, low: 1 },
      openFindings: 12,
      resolvedFindings: 4,
      openRatio: 75,
      scanHealthScore: 99,
    });
  });

  it("constructs a complete rolling thirty-day drift series", () => {
    const series = riskTrendSeries(snapshot());
    expect(series).toHaveLength(30);
    expect(
      series.reduce(
        (total, point) => total + point.new + point.resolved + point.regressed,
        0
      )
    ).toBe(89);
    expect(series[0]?.date).toBe("2026-07-21");
    expect(series[29]?.date).toBe("2026-08-19");
  });

  it("calculates framework coverage and provider-scoped compliance from control records", () => {
    const coverage = controlCoverage(snapshot());
    expect(coverage.map(item => [item.framework, item.coverage])).toEqual([
      ["cis-aws", 17],
      ["cis-azure", 33],
      ["cis-k8s", 17],
    ]);
    const azure = complianceSnapshot(snapshot(), "azure");
    expect(azure.controls).toHaveLength(6);
    expect(
      azure.frameworks.find(item => item.framework === "cis-azure")?.score
    ).toBe(33);
    expect(
      azure.frameworks.find(item => item.framework === "cis-aws")?.total
    ).toBe(0);
    const kubernetesScanner = complianceSnapshot(
      snapshot(),
      "all",
      "basalt-k8s"
    );
    expect(kubernetesScanner.controls).toHaveLength(5);
    expect(
      kubernetesScanner.controls.every(
        control => control.provider === "kubernetes"
      )
    ).toBe(true);
  });

  it("filters, orders, and paginates warehouse findings without frontend-owned values", () => {
    const result = findingPage(snapshot(), {
      page: 1,
      pageSize: 2,
      severity: "critical",
      scanner: "basalt-k8s",
      status: "open",
      search: "privileged",
      sortBy: "severity",
      sortDirection: "desc",
    });
    expect(result).toMatchObject({ total: 1, page: 1, pageCount: 1 });
    expect(result.items[0]).toMatchObject({
      resourceName: "node-agent",
      severity: "critical",
      framework: "cis-k8s",
    });
  });

  it("produces an actionable executive rollup from the same warehouse snapshot", () => {
    const result = executiveSummary(snapshot());
    expect(result.postureScore).toBeGreaterThan(0);
    expect(result.topCriticalFindings).toHaveLength(5);
    expect(result.topCriticalFindings[0]).toMatchObject({
      riskScore: 98,
      resourceName: "production-root",
    });
    expect(result.riskNarrative).toContain("5 critical");
  });
});
