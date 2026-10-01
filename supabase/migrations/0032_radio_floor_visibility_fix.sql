-- Section 14: allow authorized staff to observe floor state on non-private channels without weakening private-channel membership.
drop policy if exists safety_radio_floor_leases_select on public.safety_radio_floor_leases;
create policy safety_radio_floor_leases_select on public.safety_radio_floor_leases
for select to authenticated
using (
  holder_id=(select auth.uid())
  or exists (
    select 1
    from public.safety_radio_channels c
    where c.id=channel_id
      and c.is_active
      and private.is_staff()
      and (
        c.channel_type<>'private'
        or c.created_by=(select auth.uid())
        or private.is_admin_manager()
        or exists(
          select 1 from public.safety_radio_members m
          where m.channel_id=c.id and m.user_id=(select auth.uid())
        )
      )
  )
);
