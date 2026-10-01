import { Activity, BarChart3, Camera, ClipboardCheck, FileText, FileWarning, LayoutDashboard, Leaf, ListChecks, MessageSquareText, Radio, ShieldAlert, Siren, Target, type LucideIcon } from "lucide-react";

export type BoardRouteId = "dashboard" | "executive-hse" | "safety-intelligence" | "daily-operations-command" | "hse-management-review" | "hse-objectives" | "environmental-aspects" | "intelligence-reporting-center" | "hse-assistant" | "reports" | "actions" | "live-meeting" | "vision" | "risk" | "incidents" | "ncr" | "report";
export type ProtectedRouteId = Exclude<BoardRouteId, "report">;
export type BoardRoute = { id: BoardRouteId; path: string; label: string; group: "COMMAND CENTER" | "ASSURANCE" | "PUBLIC"; icon: LucideIcon; permission: string; protected: boolean; status: "active" | "planned" };

export const routeRegistry: Record<BoardRouteId, BoardRoute> = {
  dashboard: { id: "dashboard", path: "/admin/dashboard", label: "Dashboard", group: "COMMAND CENTER", icon: LayoutDashboard, permission: "dashboard.view", protected: true, status: "active" },
  "executive-hse": { id: "executive-hse", path: "/admin/executive-hse", label: "Executive HSE", group: "COMMAND CENTER", icon: LayoutDashboard, permission: "overview.read", protected: true, status: "active" },
  "safety-intelligence": { id: "safety-intelligence", path: "/admin/safety-intelligence", label: "Safety Intelligence", group: "COMMAND CENTER", icon: BarChart3, permission: "overview.read", protected: true, status: "active" },
  "daily-operations-command": { id: "daily-operations-command", path: "/admin/daily-operations-command", label: "Daily Operations", group: "COMMAND CENTER", icon: Activity, permission: "overview.read", protected: true, status: "active" },
  "hse-management-review": { id: "hse-management-review", path: "/admin/hse-management-review", label: "Management Review", group: "COMMAND CENTER", icon: ClipboardCheck, permission: "overview.manage", protected: true, status: "active" },
  "hse-objectives": { id: "hse-objectives", path: "/admin/hse-objectives", label: "HSE Objectives", group: "COMMAND CENTER", icon: Target, permission: "overview.manage", protected: true, status: "active" },
  "environmental-aspects": { id: "environmental-aspects", path: "/admin/environmental-aspects", label: "Environmental Aspects", group: "COMMAND CENTER", icon: Leaf, permission: "overview.manage", protected: true, status: "active" },
  "intelligence-reporting-center": { id: "intelligence-reporting-center", path: "/admin/intelligence-reporting-center", label: "Reporting Center", group: "COMMAND CENTER", icon: FileText, permission: "overview.read", protected: true, status: "active" },
  "hse-assistant": { id: "hse-assistant", path: "/admin/hse-assistant", label: "HSE Assistant", group: "COMMAND CENTER", icon: MessageSquareText, permission: "overview.read", protected: true, status: "active" },
  reports: { id: "reports", path: "/admin/reports", label: "Safety reports", group: "COMMAND CENTER", icon: FileWarning, permission: "reports.read", protected: true, status: "active" },
  actions: { id: "actions", path: "/admin/actions", label: "Action tracker", group: "COMMAND CENTER", icon: ListChecks, permission: "actions.read", protected: true, status: "active" },
  "live-meeting": { id: "live-meeting", path: "/admin/live-meeting", label: "Live meetings", group: "COMMAND CENTER", icon: Radio, permission: "meetings.create", protected: true, status: "active" },
  vision: { id: "vision", path: "/admin/vision/dashboard", label: "Safety Vision", group: "COMMAND CENTER", icon: Camera, permission: "vision.read", protected: true, status: "active" },
  risk: { id: "risk", path: "/admin/risk", label: "Risk & JSA", group: "ASSURANCE", icon: ShieldAlert, permission: "risk.read", protected: true, status: "active" },
  incidents: { id: "incidents", path: "/admin/incidents", label: "Incidents", group: "ASSURANCE", icon: Siren, permission: "incidents.read", protected: true, status: "active" },
  ncr: { id: "ncr", path: "/admin/ncr", label: "NCR / CAPA", group: "ASSURANCE", icon: ClipboardCheck, permission: "ncr.read", protected: true, status: "active" },
  report: { id: "report", path: "/report", label: "Public safety report", group: "PUBLIC", icon: FileWarning, permission: "reports.create", protected: false, status: "active" },
};

export const protectedRouteIds = Object.values(routeRegistry).filter((route) => route.protected && route.status === "active").map((route) => route.id as ProtectedRouteId);
export const moduleRouteIds = protectedRouteIds.filter((id) => id !== "dashboard") as Array<Exclude<ProtectedRouteId, "dashboard">>;
export const navigationGroups = [{ label: "COMMAND CENTER", items: [routeRegistry.dashboard, routeRegistry.reports, routeRegistry.actions, routeRegistry["live-meeting"], routeRegistry.vision] }, { label: "ASSURANCE", items: [routeRegistry.risk, routeRegistry.incidents, routeRegistry.ncr] }] as const;
export function pathForRoute(id: BoardRouteId) { return routeRegistry[id].path; }
