-- KSA SAFETY BOARD / Section 11 branding storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding-assets',
  'branding-assets',
  true,
  5242880,
  array['image/png','image/jpeg','image/webp','image/svg+xml']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists branding_assets_insert on storage.objects;
drop policy if exists branding_assets_update on storage.objects;
drop policy if exists branding_assets_delete on storage.objects;

create policy branding_assets_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'branding-assets' and private.is_admin_manager());

create policy branding_assets_update on storage.objects
for update to authenticated
using (bucket_id = 'branding-assets' and private.is_admin_manager())
with check (bucket_id = 'branding-assets' and private.is_admin_manager());

create policy branding_assets_delete on storage.objects
for delete to authenticated
using (bucket_id = 'branding-assets' and private.is_admin_manager());
