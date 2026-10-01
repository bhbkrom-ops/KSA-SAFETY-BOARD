-- Cover the generated_by foreign key used by monthly KPI ownership and audit queries.
create index if not exists safety_monthly_statistics_generated_by_idx
  on public.safety_monthly_statistics (generated_by);
