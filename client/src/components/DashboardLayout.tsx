import {
  Activity,
  BarChart3,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  Network,
  ShieldCheck,
  ShieldHalf,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/useMobile";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/" },
  { icon: Activity, label: "Risk Trends", path: "/risk-trends" },
  { icon: BarChart3, label: "Control Coverage", path: "/control-coverage" },
  { icon: ShieldCheck, label: "Compliance", path: "/compliance" },
  { icon: Network, label: "Findings", path: "/findings" },
  { icon: FileText, label: "Executive Summary", path: "/executive-summary" },
];
const SIDEBAR_WIDTH_KEY = "basalt-sidebar-width";
const DEFAULT_WIDTH = 272;
const MIN_WIDTH = 218;
const MAX_WIDTH = 360;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(
    () => Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || DEFAULT_WIDTH
  );
  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
  }, [sidebarWidth]);
  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const width = event.clientX - left;
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width);
    };
    const up = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
      document.body.style.cursor = "col-resize";
    }
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
    };
  }, [isResizing, setSidebarWidth]);
  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-white/[.07] bg-[#07101d]"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-[82px] justify-center border-b border-white/[.07] px-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,.12)]">
                <ShieldHalf className="h-[18px] w-[18px]" />
              </div>
              {!isCollapsed ? (
                <div className="min-w-0">
                  <p className="font-semibold tracking-[-.04em] text-white">
                    Basalt
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[.17em] text-slate-500">
                    Security posture
                  </p>
                </div>
              ) : null}
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3 py-5">
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[.17em] text-slate-600 group-data-[collapsible=icon]:hidden">
              Observability
            </p>
            <SidebarMenu>
              {menuItems.map(item => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location === item.path}
                    onClick={() => setLocation(item.path)}
                    tooltip={item.label}
                    className="h-10 rounded-lg text-slate-400 transition-all hover:bg-white/[.055] hover:text-slate-100 data-[active=true]:bg-cyan-300/[.12] data-[active=true]:font-medium data-[active=true]:text-cyan-100"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t border-white/[.07] p-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebar}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs text-slate-500 transition-colors hover:bg-white/[.05] hover:text-slate-300"
                >
                  <ChevronLeft className="h-4 w-4 transition-transform group-data-[collapsible=icon]:rotate-180" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    Collapse workspace
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Collapse navigation</TooltipContent>
            </Tooltip>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-cyan-300/30 ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => setIsResizing(true)}
        />
      </div>
      <SidebarInset className="bg-[#050b16]">
        {isMobile ? (
          <div className="print:hidden sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/[.07] bg-[#07101d]/95 px-4 backdrop-blur">
            <SidebarTrigger className="h-9 w-9 rounded-lg border border-white/[.08] bg-white/[.025] text-cyan-100 hover:bg-cyan-300/[.1] hover:text-cyan-100" />
            <div>
              <p className="text-sm font-semibold tracking-[-.03em] text-white">
                Basalt
              </p>
              <p className="text-[9px] font-medium uppercase tracking-[.16em] text-slate-500">
                Security posture
              </p>
            </div>
          </div>
        ) : null}
        <main className="min-h-screen p-5 sm:p-7 lg:p-9">{children}</main>
      </SidebarInset>
    </>
  );
}
