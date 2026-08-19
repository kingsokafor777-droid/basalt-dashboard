import {
  InsightCard,
  MetricCard,
  PageHeader,
  QueryState,
  SeverityBadge,
  formatDate,
} from "@/components/BasaltPrimitives";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  CheckCheck,
  CircleAlert,
  Radar,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const severityColors = {
  critical: "#fb4b70",
  high: "#fb923c",
  medium: "#facc15",
  low: "#38bdf8",
};

export default function Overview() {
  const query = trpc.dashboard.overview.useQuery();
  const data = query.data;
  const severityData = data
    ? (["critical", "high", "medium", "low"] as const).map(key => ({
        name: key,
        value: data.severity[key],
      }))
    : [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Security observability"
        title="Posture command center"
        description="A decision-ready view of normalized findings ingested from the Basalt warehouse across cloud, Kubernetes, and infrastructure-as-code scanners."
      />
      <QueryState loading={query.isLoading} error={query.error}>
        {data ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total findings"
                value={data.totalFindings}
                detail="Current observation set across all scanner scopes."
                icon={ShieldAlert}
                trend="up"
              />
              <MetricCard
                label="Open exposure"
                value={`${data.openRatio}%`}
                detail={`${data.openFindings} open / ${data.resolvedFindings} resolved observations.`}
                icon={CircleAlert}
                trend="up"
              />
              <MetricCard
                label="Scan health"
                value={`${data.scanHealthScore}%`}
                detail={`Last completed ${formatDate(data.lastScanAt, true)} from the portfolio scanner fleet.`}
                icon={Activity}
                trend="flat"
              />
              <MetricCard
                label="Resolution count"
                value={data.resolvedFindings}
                detail="Findings remediated or no longer observed in the warehouse."
                icon={CheckCheck}
                trend="down"
              />
            </section>
            <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
              <InsightCard
                title="Severity distribution"
                action={
                  <span className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">
                    Current findings
                  </span>
                }
              >
                <div className="grid gap-5 md:grid-cols-[220px_1fr] md:items-center">
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={severityData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={63}
                          outerRadius={88}
                          paddingAngle={4}
                          stroke="none"
                          isAnimationActive
                        >
                          {severityData.map(entry => (
                            <Cell
                              key={entry.name}
                              fill={severityColors[entry.name]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#07101f",
                            border: "1px solid rgba(255,255,255,.1)",
                            borderRadius: 10,
                          }}
                          itemStyle={{ color: "#e2e8f0" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {severityData.map(item => (
                      <div
                        key={item.name}
                        className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"
                      >
                        <SeverityBadge severity={item.name} />
                        <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                          {item.value}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Active observations
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </InsightCard>
              <InsightCard title="Operational signal">
                <div className="space-y-4">
                  <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
                      <Radar className="h-4 w-4" /> Continuous scanner coverage
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {data.scanHealthScore}% of scheduled scan executions
                      completed cleanly across the rolling warehouse window.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
                      <ShieldCheck className="h-4 w-4 text-emerald-300" />{" "}
                      Resolution posture
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {data.resolvedFindings} findings are now resolved; retain
                      verification scans before closing remediation workstreams.
                    </p>
                  </div>
                </div>
              </InsightCard>
            </section>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
