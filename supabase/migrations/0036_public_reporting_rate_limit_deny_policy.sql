-- Section 15: explicit deny policy for the service-only public reporting rate-limit table.
drop policy if exists public_report_rate_limits_deny_client_access on public.public_report_rate_limits;
create policy public_report_rate_limits_deny_client_access
on public.public_report_rate_limits
for all
to anon, authenticated
using (false)
with check (false);
