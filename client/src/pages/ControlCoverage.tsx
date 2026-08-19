import {
  InsightCard,
  PageHeader,
  QueryState,
  SeverityBadge,
  StatusBadge,
  formatDate,
} from "@/components/BasaltPrimitives";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowDownUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ControlCoverage() {
  const query = trpc.dashboard.controlCoverage.useQuery();
  const [descending, setDescending] = useState(false);
  const rows = useMemo(() => {
    if (!query.data) return [];
    return query.data
      .slice()
      .sort((left, right) =>
        descending
          ? left.coverage - right.coverage
          : right.coverage - left.coverage
      );
  }, [descending, query.data]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Control assurance"
        title="Control coverage"
        description="Coverage evaluates passing and failing controls across the CIS frameworks represented in the Basalt control catalogue."
      />
      <QueryState loading={query.isLoading} error={query.error}>
        {query.data ? (
          <>
            <InsightCard
              title="Framework control posture"
              action={
                <span className="text-xs text-slate-500">
                  Pass versus fail by framework
                </span>
              }
            >
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={query.data}
                    barGap={7}
                    margin={{ top: 8, right: 0, left: -22, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="rgba(148,163,184,.13)"
                    />
                    <XAxis
                      dataKey="framework"
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,.035)" }}
                      contentStyle={{
                        background: "#07101f",
                        border: "1px solid rgba(255,255,255,.11)",
                        borderRadius: 10,
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        color: "#cbd5e1",
                        fontSize: 12,
                        paddingTop: 16,
                      }}
                    />
                    <Bar
                      dataKey="passing"
                      name="Passing"
                      fill="#34d399"
                      radius={[5, 5, 0, 0]}
                      animationDuration={650}
                    />
                    <Bar
                      dataKey="failing"
                      name="Failing"
                      fill="#fb4b70"
                      radius={[5, 5, 0, 0]}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </InsightCard>
            <InsightCard
              title="Coverage register"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDescending(value => !value)}
                  className="text-xs text-slate-300 hover:bg-white/[.06] hover:text-white"
                >
                  <ArrowDownUp className="mr-2 h-3.5 w-3.5" />
                  Sort coverage
                </Button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-white/[.06] text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">
                      <th className="px-3 pb-3">Framework</th>
                      <th className="px-3 pb-3">Control</th>
                      <th className="px-3 pb-3">Status</th>
                      <th className="px-3 pb-3">Severity</th>
                      <th className="px-3 pb-3">Last evaluated</th>
                      <th className="px-3 pb-3 text-right">Coverage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.flatMap(group =>
                      group.controls.map(control => (
                        <tr
                          key={control.id}
                          className="border-b border-white/[.045] text-sm transition-colors hover:bg-white/[.025]"
                        >
                          <td className="px-3 py-3 font-mono text-xs text-cyan-200">
                            {group.framework}
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-medium text-slate-200">
                              {control.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {control.id}
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            <StatusBadge status={control.status} />
                          </td>
                          <td className="px-3 py-3">
                            <SeverityBadge severity={control.severity} />
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-400">
                            {formatDate(control.lastEvaluatedAt)}
                          </td>
                          <td className="px-3 py-3 text-right text-sm font-semibold text-white">
                            {group.coverage}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </InsightCard>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
