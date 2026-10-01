import {
  ClipboardCheck,
  FileWarning,
  LayoutDashboard,
  ListChecks,
  Radio,
  ShieldAlert,
  Siren,
  type LucideIcon,
} from "lucide-react";

export type BoardRouteId = "dashboard" | "reports" | "actions" | "live-meeting" | "risk" | "incidents" | "ncr" | "report";
export type ProtectedRouteId = Exclude<BoardRouteId, "report">;

export type BoardRoute = {
  id: BoardRouteId;
  path: string;
  label: string;
  group: "COMMAND CENTER" | "ASSURANCE" | "PUBLIC";
  icon: LucideIcon;
  permission: string;
  protected: boolean;
  status: "active" | "planned";
};

export const routeRegistry: Record<BoardRouteId, BoardRoute> = {
  dashboard: {
    id: "dashboard",
    path: "/admin/dashboard",
    label: "Dashboard",
    group: "COMMAND CENTER",
    icon: LayoutDashboard,
    permission: "dashboard.view",
    protected: true,
    status: "active",
  },
  reports: {
    id: "reports",
    path: "/admin/reports",
    label: "Safety reports",
    group: "COMMAND CENTER",
    icon: FileWarning,
    permission: "reports.read",
    protected: true,
    status: "active",
  },
  actions: {
    id: "actions",
    path: "/admin/actions",
    label: "Action tracker",
    group: "COMMAND CENTER",
    icon: ListChecks,
    permission: "actions.read",
    protected: true,
    status: "active",
  },
  "live-meeting": {
    id: "live-meeting",
    path: "/admin/live-meeting",
    label: "Live meetings",
    group: "COMMAND CENTER",
    icon: Radio,
    permission: "meetings.create",
    protected: true,
    status: "active",
  },
  risk: {
    id: "risk",
    path: "/admin/risk",
    label: "Risk & JSA",
    group: "ASSURANCE",
    icon: ShieldAlert,
    permission: "risk.read",
    protected: true,
    status: "active",
  },
  incidents: {
    id: "incidents",
    path: "/admin/incidents",
    label: "Incidents",
    group: "ASSURANCE",
    icon: Siren,
    permission: "incidents.read",
    protected: true,
    status: "active",
  },
  ncr: {
    id: "ncr",
    path: "/admin/ncr",
    label: "NCR / CAPA",
    group: "ASSURANCE",
    icon: ClipboardCheck,
    permission: "ncr.read",
    protected: true,
    status: "active",
  },
  report: {
    id: "report",
    path: "/report",
    label: "Public safety report",
    group: "PUBLIC",
    icon: FileWarning,
    permission: "reports.create",
    protected: false,
    status: "active",
  },
};

export const protectedRouteIds = Object.values(routeRegistry)
  .filter((route) => route.protected && route.status === "active")
  .map((route) => route.id as ProtectedRouteId);

export const moduleRouteIds = protectedRouteIds.filter((id) => id !== "dashboard") as Array<Exclude<ProtectedRouteId, "dashboard">>;

export const navigationGroups = [
  {
    label: "COMMAND CENTER",
    items: [routeRegistry.dashboard, routeRegistry.reports, routeRegistry.actions, routeRegistry["live-meeting"]],
  },
  {
    label: "ASSURANCE",
    items: [routeRegistry.risk, routeRegistry.incidents, routeRegistry.ncr],
  },
] as const;

export function pathForRoute(id: BoardRouteId) {
  return routeRegistry[id].path;
}
