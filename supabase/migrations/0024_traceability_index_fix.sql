-- Section 13 release gate: cover remaining FK index.
create index if not exists hse_workflow_links_created_by_idx on public.hse_workflow_links(created_by);
