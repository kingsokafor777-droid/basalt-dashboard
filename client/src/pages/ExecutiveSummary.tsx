import {
  InsightCard,
  PageHeader,
  QueryState,
  formatDate,
} from "@/components/BasaltPrimitives";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Download, Printer, ShieldCheck } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

export default function ExecutiveSummary() {
  const query = trpc.dashboard.executiveSummary.useQuery();
  const exportReport = () => {
    if (!query.data) return;
    const blob = new Blob([JSON.stringify(query.data, null, 2)], {
      type: "application/json",
    });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "basalt-executive-summary.json";
    anchor.click();
    URL.revokeObjectURL(href);
  };
  return (
    <div className="space-y-7 print:space-y-4">
      <PageHeader
        eyebrow="Leadership briefing"
        title="Executive summary"
        description="A concise, printable posture narrative and remediation priority set for security leadership."
        actions={
          <div className="flex gap-2 print:hidden">
            <Button
              variant="outline"
              onClick={exportReport}
              className="border-white/[.12] bg-white/[.025] text-slate-200 hover:bg-white/[.08] hover:text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={() => window.print()}
              className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        }
      />
      <QueryState loading={query.isLoading} error={query.error}>
        {query.data ? (
          <div className="executive-report space-y-4">
            <section className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-[radial-gradient(circle_at_80%_10%,rgba(34,211,238,.15),transparent_28%),#07101f] p-6 sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.19em] text-cyan-200">
                    Basalt posture score
                  </p>
                  <p className="mt-3 text-7xl font-semibold tracking-[-.08em] text-white">
                    {query.data.postureScore}
                    <span className="text-2xl text-slate-400">/100</span>
                  </p>
                  <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
                    Score blends framework coverage with weighted open-risk
                    exposure. Generated from warehouse observations through{" "}
                    {formatDate(query.data.generatedAt)}.
                  </p>
                </div>
                <div className="h-44 rounded-xl border border-white/[.08] bg-black/15 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">
                    Posture trajectory
                  </p>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={query.data.postureTrend}>
                        <Tooltip
                          contentStyle={{
                            background: "#07101f",
                            border: "1px solid rgba(255,255,255,.11)",
                            borderRadius: 10,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#67e8f9"
                          strokeWidth={2.5}
                          dot={false}
                          animationDuration={700}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>
            <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
              <InsightCard title="Risk narrative">
                <p className="text-sm leading-7 text-slate-300">
                  {query.data.riskNarrative}
                </p>
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-cyan-300/12 bg-cyan-300/[.045] p-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                  <p className="text-xs leading-5 text-slate-400">
                    Prioritize independently verified remediation for critical
                    exposure paths before accepting posture-score improvement.
                  </p>
                </div>
              </InsightCard>
              <InsightCard title="Compliance scorecard">
                <div className="space-y-3">
                  {query.data.compliance.map(item => (
                    <div key={item.framework}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-300">
                          {item.framework}
                        </span>
                        <strong className="text-white">{item.score}%</strong>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[.07]">
                        <div
                          className="h-full rounded-full bg-cyan-300"
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </InsightCard>
            </section>
            <InsightCard
              title="Top critical findings"
              action={
                <span className="text-xs text-slate-500">
                  Ranked by risk score
                </span>
              }
            >
              <div className="divide-y divide-white/[.06]">
                {query.data.topCriticalFindings.map((finding, index) => (
                  <div
                    key={finding.id}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-rose-400/20 bg-rose-400/10 font-mono text-xs text-rose-300">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">
                        {finding.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {finding.resourceName} · {finding.controlId} ·{" "}
                        {finding.scanner}
                      </p>
                    </div>
                    <span className="font-mono text-sm text-rose-300">
                      {finding.riskScore}
                    </span>
                  </div>
                ))}
              </div>
            </InsightCard>
          </div>
        ) : null}
      </QueryState>
    </div>
  );
}
