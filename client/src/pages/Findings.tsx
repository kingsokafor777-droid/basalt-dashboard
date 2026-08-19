import {
  PageHeader,
  QueryState,
  SeverityBadge,
  StatusBadge,
  formatDate,
} from "@/components/BasaltPrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";

type SortBy =
  | "severity"
  | "scanner"
  | "controlId"
  | "resource"
  | "status"
  | "firstSeen"
  | "lastSeen";
const selectOptions = {
  severity: ["all", "critical", "high", "medium", "low"],
  scanner: ["all", "basalt-aws", "basalt-azure", "basalt-k8s", "basalt-iac"],
  status: ["all", "open", "resolved"],
};

export default function Findings() {
  const [severity, setSeverity] = useState("all");
  const [scanner, setScanner] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>("severity");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const input = useMemo(
    () => ({
      page,
      pageSize: 8,
      severity,
      scanner,
      status,
      search: search || undefined,
      sortBy,
      sortDirection,
    }),
    [page, severity, scanner, status, search, sortBy, sortDirection]
  );
  const query = trpc.dashboard.findings.useQuery(input);
  const selected =
    query.data?.items.find(item => item.id === selectedId) ?? null;
  const setFilter = (
    type: "severity" | "scanner" | "status",
    value: string
  ) => {
    setPage(1);
    if (type === "severity") setSeverity(value);
    if (type === "scanner") setScanner(value);
    if (type === "status") setStatus(value);
  };
  const sort = (field: SortBy) => {
    if (sortBy === field)
      setSortDirection(direction => (direction === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };
  const heading = (label: string, field: SortBy) => (
    <button
      onClick={() => sort(field)}
      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.12em] text-slate-500 hover:text-slate-200"
    >
      {label}
      {sortBy === field ? (
        sortDirection === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : null}
    </button>
  );
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Exposure register"
        title="Findings"
        description="Filter, rank, and investigate normalized finding observations without leaving the warehouse-backed posture workspace."
      />
      <div className="flex flex-col gap-3 rounded-2xl border border-white/[.08] bg-slate-950/60 p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={event => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search control, resource, or scanner"
            className="border-white/[.08] bg-white/[.025] pl-9 text-slate-200 placeholder:text-slate-600"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <SlidersHorizontal className="mt-2 h-4 w-4 text-slate-500" />
          {(["severity", "scanner", "status"] as const).map(filter => (
            <Select
              key={filter}
              value={
                filter === "severity"
                  ? severity
                  : filter === "scanner"
                    ? scanner
                    : status
              }
              onValueChange={value => setFilter(filter, value)}
            >
              <SelectTrigger className="h-9 w-[142px] border-white/[.08] bg-white/[.025] text-xs text-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectOptions[filter].map(value => (
                  <SelectItem key={value} value={value}>
                    {value === "all" ? `All ${filter}s` : value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      </div>
      <QueryState loading={query.isLoading} error={query.error}>
        {query.data ? (
          <div className="overflow-hidden rounded-2xl border border-white/[.08] bg-slate-950/60 shadow-[0_12px_40px_rgba(0,0,0,.18)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left">
                <thead>
                  <tr className="border-b border-white/[.07]">
                    <th className="px-4 py-3">
                      {heading("Severity", "severity")}
                    </th>
                    <th className="px-4 py-3">
                      {heading("Scanner", "scanner")}
                    </th>
                    <th className="px-4 py-3">
                      {heading("Control", "controlId")}
                    </th>
                    <th className="px-4 py-3">
                      {heading("Resource", "resource")}
                    </th>
                    <th className="px-4 py-3">{heading("Status", "status")}</th>
                    <th className="px-4 py-3">
                      {heading("First seen", "firstSeen")}
                    </th>
                    <th className="px-4 py-3">
                      {heading("Last seen", "lastSeen")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map(item => (
                    <tr
                      tabIndex={0}
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      onKeyDown={event => {
                        if (event.key === "Enter") setSelectedId(item.id);
                      }}
                      className="cursor-pointer border-b border-white/[.045] transition-colors hover:bg-cyan-300/[.035] focus:bg-cyan-300/[.035] focus:outline-none"
                    >
                      <td className="px-4 py-3">
                        <SeverityBadge severity={item.severity} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-cyan-200">
                        {item.scanner}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-slate-300">
                          {item.controlId}
                        </p>
                        <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                          {item.title}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[200px] truncate text-sm text-slate-200">
                          {item.resourceName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.resourceType}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {formatDate(item.firstSeenAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {formatDate(item.lastSeenAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-white/[.06] px-4 py-3">
              <p className="text-xs text-slate-500">
                Showing {query.data.items.length} of {query.data.total} findings
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={query.data.page <= 1}
                  onClick={() => setPage(value => Math.max(1, value - 1))}
                  className="text-slate-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-slate-400">
                  Page {query.data.page} / {query.data.pageCount}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={query.data.page >= query.data.pageCount}
                  onClick={() =>
                    setPage(value => Math.min(query.data.pageCount, value + 1))
                  }
                  className="text-slate-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </QueryState>
      <Sheet
        open={selected !== null}
        onOpenChange={open => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-white/[.1] bg-[#08111f] p-0 sm:max-w-xl"
        >
          <SheetHeader className="border-b border-white/[.07] px-6 py-6 text-left">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-cyan-200">
                  {selected?.controlId}
                </p>
                <SheetTitle className="mt-2 text-xl leading-7 text-white">
                  {selected?.title}
                </SheetTitle>
              </div>
              {selected ? <SeverityBadge severity={selected.severity} /> : null}
            </div>
            <SheetDescription className="mt-3 text-sm leading-6 text-slate-400">
              {selected?.description}
            </SheetDescription>
          </SheetHeader>
          {selected ? (
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-500">
                    Risk score
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {selected.riskScore}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-500">
                    Current state
                  </p>
                  <div className="mt-3">
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
              </div>
              <Detail
                label="Resource"
                value={selected.resourceName}
                secondary={selected.resourceUrn}
              />
              <Detail
                label="Scope"
                value={`${selected.account} · ${selected.region}`}
                secondary={`${selected.scanner} · ${selected.framework}`}
              />
              <Detail label="Remediation" value={selected.remediation} />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Detail({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-200">{value}</p>
      {secondary ? (
        <p className="mt-1 break-all font-mono text-xs leading-5 text-slate-500">
          {secondary}
        </p>
      ) : null}
    </div>
  );
}
