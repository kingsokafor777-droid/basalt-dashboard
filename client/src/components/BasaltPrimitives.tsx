import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";

export type Severity = "critical" | "high" | "medium" | "low";

const severityStyles: Record<Severity, string> = {
  critical:
    "border-rose-400/30 bg-rose-500/12 text-rose-300 shadow-[0_0_18px_rgba(244,63,94,.13)]",
  high: "border-orange-400/30 bg-orange-500/12 text-orange-300 shadow-[0_0_18px_rgba(249,115,22,.11)]",
  medium:
    "border-amber-300/30 bg-amber-400/12 text-amber-200 shadow-[0_0_18px_rgba(250,204,21,.1)]",
  low: "border-sky-400/30 bg-sky-500/12 text-sky-300 shadow-[0_0_18px_rgba(14,165,233,.11)]",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge
      className={cn(
        "rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]",
        severityStyles[severity]
      )}
    >
      {severity}
    </Badge>
  );
}

export function StatusBadge({
  status,
}: {
  status: "open" | "resolved" | "pass" | "fail";
}) {
  const good = status === "resolved" || status === "pass";
  return (
    <Badge
      className={cn(
        "rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]",
        good
          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
          : "border-rose-400/25 bg-rose-400/10 text-rose-300"
      )}
    >
      {status}
    </Badge>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-6 lg:flex-row lg:items-end">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          {description}
        </p>
      </div>
      {actions}
    </header>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "flat";
}) {
  const TrendIcon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendColor =
    trend === "down"
      ? "text-emerald-300"
      : trend === "up"
        ? "text-rose-300"
        : "text-slate-400";
  return (
    <Card className="overflow-hidden border-white/[0.08] bg-slate-950/60 shadow-[0_12px_40px_rgba(0,0,0,.18)] transition-transform duration-200 hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-400/8 text-cyan-200">
            <Icon className="h-4 w-4" />
          </div>
          {trend ? <TrendIcon className={cn("h-4 w-4", trendColor)} /> : null}
        </div>
        <p className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-white">
          {value}
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.13em] text-slate-400">
          {label}
        </p>
        <p className="mt-4 text-xs leading-5 text-slate-500">{detail}</p>
      </CardContent>
    </Card>
  );
}

export function InsightCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "border-white/[0.08] bg-slate-950/60 shadow-[0_12px_40px_rgba(0,0,0,.18)]",
        className
      )}
    >
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-white/[0.06] px-5 py-4">
        <CardTitle className="text-sm font-semibold tracking-tight text-slate-100">
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

export function QueryState({
  loading,
  error,
  children,
}: {
  loading: boolean;
  error?: { message?: string } | null;
  children: ReactNode;
}) {
  if (loading)
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.025]" />
    );
  if (error)
    return (
      <div className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-6 text-sm text-rose-200">
        Unable to load the warehouse view: {error.message ?? "unknown error"}
      </div>
    );
  return <>{children}</>;
}

export function formatDate(
  value: Date | string | null | undefined,
  compact = false
): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(
    "en-US",
    compact
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" }
  ).format(new Date(value));
}
