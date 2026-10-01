import type { AuthContext } from "@/lib/server-auth";

type Row = Record<string, unknown>;
type QueryResult = { data: unknown[] | null; error: { message: string } | null; count?: number | null };

async function rows(auth: AuthContext, table: string, select: string, limit = 500): Promise<Row[]> {
  const result = await auth.client.from(table).select(select).limit(limit) as unknown as QueryResult;
  if (result.error) throw new Error(`${table}: ${result.error.message}`);
  return (result.data ?? []) as Row[];
}

function isOpen(status: unknown) { return !["closed", "resolved", "false_positive", "cancelled", "achieved", "archived", "superseded"].includes(String(status)); }
function isOverdue(dateValue: unknown, status: unknown, today: string) { return Boolean(dateValue) && String(dateValue) < today && isOpen(status); }

export async function buildOverviewSnapshot(auth: AuthContext) {
  const today = new Date().toISOString().slice(0, 10);
  const [reports, actions, incidents, ncr, risks, hazards, notifications, visionAlerts, objectives, aspects, monitoring, reviews, devices] = await Promise.all([
    rows(auth, "reports", "id,reference_no,description,exact_area,status,priority,due_date,updated_at,created_at", 250),
    rows(auth, "actions", "id,reference_no,title,status,priority,due_date,source_type,source_id,updated_at", 250),
    rows(auth, "incidents", "id,reference_no,title,status,severity,occurred_at,updated_at", 250),
    rows(auth, "ncr", "id,reference_no,nonconformance,status,severity,due_date,updated_at", 250),
    rows(auth, "risk_assessments", "id,reference_no,title,status,updated_at", 250),
    rows(auth, "risk_hazards", "id,assessment_id,residual_likelihood,residual_severity,due_date", 500),
    rows(auth, "notifications", "id,title,severity,is_read,created_at", 250),
    rows(auth, "vision_alerts", "id,category,severity,status,event_timestamp", 250),
    rows(auth, "hse_objectives", "id,status,target_value,current_value,next_review_date,category,description", 250),
    rows(auth, "environmental_aspects", "id,status,review_date,environmental_medium,aspect,impact", 250),
    rows(auth, "environmental_monitoring_records", "id,status,measured_at,environmental_medium", 250),
    rows(auth, "hse_management_reviews", "id,status,period_end,title", 100),
    rows(auth, "vision_devices", "id,status,last_seen_at", 250),
  ]);
  const openReports = reports.filter((row) => isOpen(row.status));
  const openActions = actions.filter((row) => isOpen(row.status));
  const overdueActions = openActions.filter((row) => isOverdue(row.due_date, row.status, today));
  const criticalActions = openActions.filter((row) => ["critical", "high"].includes(String(row.priority)));
  const openIncidents = incidents.filter((row) => isOpen(row.status));
  const openNcr = ncr.filter((row) => isOpen(row.status));
  const overdueNcr = openNcr.filter((row) => isOverdue(row.due_date, row.status, today));
  const openRisks = risks.filter((row) => ["review", "approved", "active"].includes(String(row.status)));
  const highResidualRisks = hazards.filter((row) => Number(row.residual_likelihood ?? 0) * Number(row.residual_severity ?? 0) >= 15);
  const unreadNotifications = notifications.filter((row) => row.is_read === false);
  const activeVisionAlerts = visionAlerts.filter((row) => isOpen(row.status));
  const overdueObjectives = objectives.filter((row) => isOverdue(row.next_review_date, row.status, today));
  const exceedances = monitoring.filter((row) => row.status === "exceedance");
  const significantAspects = aspects.filter((row) => ["significant", "under_review"].includes(String(row.status)));
  const activeReviews = reviews.filter((row) => ["draft", "in_review"].includes(String(row.status)));
  const activeDevices = devices.filter((row) => ["active", "degraded"].includes(String(row.status)));

  const recent = [...reports, ...incidents, ...ncr].sort((a, b) => String(b.updated_at ?? b.occurred_at ?? "").localeCompare(String(a.updated_at ?? a.occurred_at ?? ""))).slice(0, 12);
  const leading = { open_observations: openReports.length, overdue_actions: overdueActions.length, high_residual_risks: highResidualRisks.length, active_reviews: activeReviews.length, overdue_objectives: overdueObjectives.length };
  const lagging = { open_incidents: openIncidents.length, open_ncr: openNcr.length, environmental_exceedances: exceedances.length, active_vision_alerts: activeVisionAlerts.length };

  return {
    generated_at: new Date().toISOString(),
    freshness: "live query, bounded to recent operational records",
    scope: { staff_profile_id: auth.user.id, role: auth.profile.role_code },
    coverage: { available: ["reports", "actions", "incidents", "ncr", "risk_assessments", "risk_hazards", "notifications", "vision_alerts", "hse_objectives", "environmental_aspects", "environmental_monitoring_records", "hse_management_reviews", "vision_devices"], not_configured: ["ptw", "loto", "equipment", "fire_systems", "contractors", "industrial_hygiene", "moc", "critical_controls", "safety_alerts", "handovers", "training"] },
    kpis: {
      overdue_capa: overdueActions.filter((row) => ["ncr", "incident", "risk"].includes(String(row.source_type))).length,
      critical_capa: criticalActions.filter((row) => ["ncr", "incident", "risk"].includes(String(row.source_type))).length,
      near_miss: reports.filter((row) => row.category === "near_miss" && isOpen(row.status)).length,
      active_ptw: null,
      equipment_due: null,
      inspection_compliance: null,
      top_residual_risks: highResidualRisks.length,
      critical_fire_system_faults: null,
      unsafe_emergency_exits: null,
      active_emergency_responses: null,
      blocked_contractors: null,
      chemical_issues: null,
      incidents: openIncidents.length,
      ncr: openNcr.length,
      contractors: null,
      chemicals: null,
      open_reports: openReports.length,
      overdue_actions: overdueActions.length,
      critical_actions: criticalActions.length,
      open_risks: openRisks.length,
      overdue_ncr: overdueNcr.length,
      unread_notifications: unreadNotifications.length,
      active_vision_alerts: activeVisionAlerts.length,
      active_vision_devices: activeDevices.length,
      objectives_active: objectives.filter((row) => row.status === "active").length,
      objectives_at_risk: objectives.filter((row) => row.status === "at_risk").length,
      objectives_achieved: objectives.filter((row) => row.status === "achieved").length,
      objective_reviews_due: overdueObjectives.length,
      significant_environmental_aspects: significantAspects.length,
      environmental_exceedances_30d: exceedances.length,
    },
    leading,
    lagging,
    recent,
    source_counts: { reports: reports.length, actions: actions.length, incidents: incidents.length, ncr: ncr.length, risks: risks.length, alerts: visionAlerts.length, devices: devices.length },
  };
}

export async function answerAssistant(auth: AuthContext, question: string) {
  const snapshot = await buildOverviewSnapshot(auth);
  const normalized = question.toLowerCase();
  let focus: Record<string, unknown> = snapshot.kpis;
  if (normalized.includes("capa") || normalized.includes("action")) focus = { overdue_actions: snapshot.kpis.overdue_actions, critical_actions: snapshot.kpis.critical_actions, overdue_capa: snapshot.kpis.overdue_capa };
  else if (normalized.includes("risk")) focus = { open_risks: snapshot.kpis.open_risks, top_residual_risks: snapshot.kpis.top_residual_risks };
  else if (normalized.includes("fire") || normalized.includes("emergency")) focus = { critical_fire_system_faults: snapshot.kpis.critical_fire_system_faults, unsafe_emergency_exits: snapshot.kpis.unsafe_emergency_exits, active_emergency_responses: snapshot.kpis.active_emergency_responses };
  else if (normalized.includes("vision") || normalized.includes("camera")) focus = { active_vision_alerts: snapshot.kpis.active_vision_alerts, active_vision_devices: snapshot.kpis.active_vision_devices };
  return { mode: "read_only", answer: "This operational answer is calculated from permission-scoped records; null means the source module is not configured in this deployment.", focus, generated_at: snapshot.generated_at, sources: snapshot.coverage.available };
}
