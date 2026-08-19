import {
  InsightCard,
  PageHeader,
  QueryState,
  SeverityBadge,
  StatusBadge,
} from "@/components/BasaltPrimitives";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";

const providerOptions = [
  { value: "all", label: "All providers" },
  { value: "aws", label: "AWS" },
  { value: "azure", label: "Azure" },
  { value: "kubernetes", label: "Kubernetes" },
];
const scannerOptions = [
  { value: "all", label: "All scanners" },
  { value: "basalt-aws", label: "Basalt AWS" },
  { value: "basalt-azure", label: "Basalt Azure" },
  { value: "basalt-k8s", label: "Basalt K8s" },
  { value: "basalt-iac", label: "Basalt IaC" },
];

function ComplianceGauge({
  framework,
  score,
  total,
}: {
  framework: string;
  score: number;
  total: number;
}) {
  if (total === 0)
    return (
      <div className="flex h-48 flex-col items-center justify-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-slate-700 text-lg text-slate-600">
          —
        </div>
        <p className="mt-3 text-xs font-medium text-slate-400">
          No controls observed
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[.13em] text-slate-600">
          {framework}
        </p>
      </div>
    );
  const color = score >= 70 ? "#34d399" : score >= 45 ? "#facc15" : "#fb4b70";
  return (
    <div className="relative h-48">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="66%"
          outerRadius="90%"
          startAngle={210}
          endAngle={-30}
          barSize={11}
          data={[{ score }]}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <RadialBar
            dataKey="score"
            cornerRadius={10}
            fill={color}
            background={{ fill: "rgba(148,163,184,.14)" }}
            animationDuration={750}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-3">
        <span className="text-3xl font-semibold tracking-[-.05em] text-white">
          {score}%
        </span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[.12em] text-slate-500">
          {framework}
        </span>
      </div>
    </div>
  );
}

export default function Compliance() {
  const [provider, setProvider] = useState("all");
  const [scanner, setScanner] = useState("all");
  const query = trpc.dashboard.compliance.useQuery({ provider, scanner });
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Framework alignment"
        title="Compliance posture"
        description="Framework-level control scores and current state heatmap, filterable by provider and the scanner that observed the control."
        actions={
          <div className="flex gap-2">
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="w-[160px] border-white/[.11] bg-slate-950 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providerOptions.map(option => (
                  <SelectItem value={option.value} key={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={scanner} onValueChange={setScanner}>
              <SelectTrigger className="w-[165px] border-white/[.11] bg-slate-950 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scannerOptions.map(option => (
                  <SelectItem value={option.value} key={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <QueryState loading={query.isLoading} error={query.error}>
        {query.data ? (
          <>
            <section className="grid gap-4 lg:grid-cols-3">
              {query.data.frameworks.map(item => (
                <InsightCard
                  key={item.framework}
                  title={item.framework}
                  action={
                    <span className="text-xs text-slate-500">
                      {item.total === 0
                        ? "No data"
                        : `${item.passing}/${item.total} passing`}
                    </span>
                  }
                >
                  <ComplianceGauge
                    framework={item.framework}
                    score={item.score}
                    total={item.total}
                  />
                </InsightCard>
              ))}
            </section>
            <InsightCard
              title="Control-state heatmap"
              action={
                <span className="text-xs text-slate-500">
                  Current evaluation state
                </span>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {query.data.controls.map(control => (
                  <div
                    key={control.id}
                    className={`rounded-xl border p-4 ${control.status === "pass" ? "border-emerald-400/15 bg-emerald-400/[.045]" : "border-rose-400/15 bg-rose-400/[.045]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[10px] text-slate-400">
                          {control.id}
                        </p>
                        <p className="mt-2 text-sm font-medium leading-5 text-slate-200">
                          {control.title}
                        </p>
                      </div>
                      <StatusBadge status={control.status} />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-500">
                        {control.framework}
                      </span>
                      <SeverityBadge severity={control.severity} />
                    </div>
                  </div>
                ))}
              </div>
            </InsightCard>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
