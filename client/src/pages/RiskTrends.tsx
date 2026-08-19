import {
  InsightCard,
  PageHeader,
  QueryState,
} from "@/components/BasaltPrimitives";
import { trpc } from "@/lib/trpc";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function RiskTrends() {
  const query = trpc.dashboard.riskTrend.useQuery();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Drift intelligence"
        title="Risk trends"
        description="Thirty days of new, resolved, and regressed findings derived from immutable warehouse drift events."
      />
      <QueryState loading={query.isLoading} error={query.error}>
        {query.data ? (
          <InsightCard
            title="Finding state transitions"
            action={
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.15em] text-cyan-200">
                Rolling 30 days
              </span>
            }
          >
            <div className="h-[390px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={query.data}
                  margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="newGradient"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#fb4b70" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#fb4b70" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="resolvedGradient"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#22c55e"
                        stopOpacity={0.35}
                      />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(148,163,184,.13)"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={value => value.slice(5)}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={25}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#07101f",
                      border: "1px solid rgba(255,255,255,.11)",
                      borderRadius: 10,
                      color: "#e2e8f0",
                    }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: "#cbd5e1",
                      fontSize: 12,
                      paddingTop: 16,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="new"
                    name="New"
                    stroke="#fb4b70"
                    fill="url(#newGradient)"
                    strokeWidth={2}
                    animationDuration={650}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke="#22c55e"
                    fill="url(#resolvedGradient)"
                    strokeWidth={2}
                    animationDuration={800}
                  />
                  <Area
                    type="monotone"
                    dataKey="regressed"
                    name="Regressed"
                    stroke="#f59e0b"
                    fill="transparent"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <p className="rounded-xl border border-rose-400/15 bg-rose-400/[0.045] p-3 text-xs leading-5 text-slate-400">
                <strong className="text-rose-300">New</strong> signals exposures
                entering scope.
              </p>
              <p className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.045] p-3 text-xs leading-5 text-slate-400">
                <strong className="text-emerald-300">Resolved</strong> tracks
                evidence-backed remediation.
              </p>
              <p className="rounded-xl border border-amber-400/15 bg-amber-400/[0.045] p-3 text-xs leading-5 text-slate-400">
                <strong className="text-amber-200">Regressed</strong> flags
                controls returning to failure.
              </p>
            </div>
          </InsightCard>
        ) : null}
      </QueryState>
    </div>
  );
}
