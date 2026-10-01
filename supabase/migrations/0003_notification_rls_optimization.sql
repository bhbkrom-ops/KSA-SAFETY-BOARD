-- Avoid per-row auth lookup in notification policies.
drop policy if exists recipient_notifications on public.notifications;
drop policy if exists recipient_notifications_update on public.notifications;
create policy recipient_notifications on public.notifications for select to authenticated using (recipient_id = (select auth.uid()));
create policy recipient_notifications_update on public.notifications for update to authenticated using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
