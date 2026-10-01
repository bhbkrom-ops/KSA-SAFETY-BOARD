-- Section 15 hardening: remove anonymous table privileges from authentication security state.
revoke all on public.auth_security_state from anon;
revoke all on public.auth_security_events from anon;
grant select on public.auth_security_state to authenticated;
grant select on public.auth_security_events to authenticated;
