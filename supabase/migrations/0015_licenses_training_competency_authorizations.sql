-- KSA SAFETY BOARD / Section 07
-- Licenses, training, operational authorizations, competency, matrix, and official templates.

insert into public.permissions(code, description) values
 ('licenses.read','Read professional licenses'), ('licenses.manage','Manage professional licenses'),
 ('training.read','Read training records'), ('training.manage','Manage training records'),
 ('competency.read','Read competency records'), ('competency.manage','Manage competency records'),
 ('equipment_auth.read','Read equipment authorizations'), ('equipment_auth.manage','Manage equipment authorizations'),
 ('training_matrix.read','Read training matrix'), ('training_matrix.manage','Manage training matrix'),
 ('official_templates.read','Read official templates'), ('official_templates.manage','Manage official templates'),
 ('enterprise_reports.read','Read enterprise authorization reports')
on conflict (code) do nothing;

create table if not exists public.licenses (
 id uuid primary key default gen_random_uuid(), reference_no text not null unique,
 employee_ref uuid references public.employee_directory(id), employee_id text not null, employee_name text not null,
 license_type text not null check (license_type in ('driving','forklift','overhead_crane','lifter_manlift','mewp','heavy_vehicle','other')),
 qualification_name text not null, issuer text, certificate_number text, issue_date date, expiry_date date,
 status text not null default 'NO_EXPIRY' check (status in ('VALID','EXPIRING_SOON','EXPIRED','NO_EXPIRY')),
 evidence_url text, notes text, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.trainings (
 id uuid primary key default gen_random_uuid(), reference_no text not null unique, title text not null, title_ar text,
 category text not null default 'general_hse' check (category in ('toolbox_talk','general_hse','fire_safety','loto','confined_space','first_aid','working_at_heights','other')),
 trainer text, factory text, location text, starts_at timestamptz not null, duration_minutes integer check (duration_minutes is null or duration_minutes between 1 and 1440), objectives text,
 status text not null default 'planned' check (status in ('planned','in_progress','completed','cancelled')),
 created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.training_attendance (
 id uuid primary key default gen_random_uuid(), training_id uuid not null references public.trainings(id) on delete cascade,
 employee_ref uuid references public.employee_directory(id), employee_id text not null, employee_name text not null,
 attendance_status text not null default 'PRESENT' check (attendance_status in ('PRESENT','ABSENT','EXCUSED')),
 certificate_number text, certificate_issued_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(training_id, employee_id)
);
create table if not exists public.equipment_authorizations (
 id uuid primary key default gen_random_uuid(), authorization_no text not null unique,
 employee_ref uuid references public.employee_directory(id), employee_id text not null, employee_name text not null,
 category text not null check (category in ('forklift_operation','overhead_crane_operation','personnel_lift_manlift','mewp','rigging_banksman','electrical_work','loto','work_at_height','confined_space_entry')),
 equipment_name text, issuing_authority text, issue_date date, expiry_date date,
 status text not null default 'VALID' check (status in ('VALID','EXPIRING_SOON','EXPIRED','SUSPENDED','NO_EXPIRY')),
 restrictions text, evidence_url text, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.training_matrix (
 id uuid primary key default gen_random_uuid(), employee_ref uuid references public.employee_directory(id), employee_id text not null, employee_name text not null,
 course_code text not null, course_name text not null check (course_name in ('general_hse_induction','fire_safety_extinguisher','loto','confined_space','first_aid_cpr','working_at_heights')),
 status text not null default 'PENDING' check (status in ('COMPLETED','PENDING','EXPIRED')),
 qualification_date date, expiry_date date, evidence_url text, notes text, updated_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(employee_id, course_name)
);
create table if not exists public.competency (
 id uuid primary key default gen_random_uuid(), reference_no text not null unique,
 employee_ref uuid references public.employee_directory(id), employee_id text not null, employee_name text not null, department text,
 qualification_name text not null, category text not null check (category in ('license','certification','medical','operator_authorization')),
 issuer text, certificate_number text, issue_date date, expiry_date date,
 status text not null default 'VALID' check (status in ('VALID','EXPIRING_SOON','EXPIRED')),
 linked_license_id uuid references public.licenses(id), linked_authorization_id uuid references public.equipment_authorizations(id), linked_training_matrix_id uuid references public.training_matrix(id), evidence_url text, notes text,
 created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.official_templates (
 id uuid primary key default gen_random_uuid(), template_type text not null check (template_type in ('equipment_authorization_card','professional_license_card','fire_drill_certificate','safety_training_certificate')),
 document_no text not null unique, holder_name text, holder_name_ar text, employee_id text, participant_name text, participant_name_ar text, title text, title_ar text,
 issue_date date, expiry_date date, photo_url text, source_type text, source_id uuid, board_name text not null default 'KSA SAFETY BOARD', logo_url text, status text not null default 'DRAFT' check (status in ('DRAFT','ISSUED','VOID')),
 created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists licenses_employee_status_expiry_idx on public.licenses(employee_id, status, expiry_date);
create index if not exists trainings_starts_status_idx on public.trainings(starts_at desc, status);
create index if not exists training_attendance_training_idx on public.training_attendance(training_id, attendance_status);
create index if not exists equipment_auth_employee_status_idx on public.equipment_authorizations(employee_id, status, expiry_date);
create index if not exists training_matrix_employee_status_idx on public.training_matrix(employee_id, status, expiry_date);
create index if not exists competency_employee_status_idx on public.competency(employee_id, status, expiry_date);
create index if not exists official_templates_type_created_idx on public.official_templates(template_type, created_at desc);

alter table public.licenses enable row level security; alter table public.trainings enable row level security; alter table public.training_attendance enable row level security; alter table public.equipment_authorizations enable row level security; alter table public.training_matrix enable row level security; alter table public.competency enable row level security; alter table public.official_templates enable row level security;
drop policy if exists licenses_staff_all on public.licenses; create policy licenses_staff_all on public.licenses for all to authenticated using (private.is_staff()) with check (private.is_staff());
drop policy if exists trainings_staff_all on public.trainings; create policy trainings_staff_all on public.trainings for all to authenticated using (private.is_staff()) with check (private.is_staff());
drop policy if exists training_attendance_staff_all on public.training_attendance; create policy training_attendance_staff_all on public.training_attendance for all to authenticated using (private.is_staff()) with check (private.is_staff());
drop policy if exists equipment_authorizations_staff_all on public.equipment_authorizations; create policy equipment_authorizations_staff_all on public.equipment_authorizations for all to authenticated using (private.is_staff()) with check (private.is_staff());
drop policy if exists training_matrix_staff_all on public.training_matrix; create policy training_matrix_staff_all on public.training_matrix for all to authenticated using (private.is_staff()) with check (private.is_staff());
drop policy if exists competency_staff_all on public.competency; create policy competency_staff_all on public.competency for all to authenticated using (private.is_staff()) with check (private.is_staff());
drop policy if exists official_templates_staff_all on public.official_templates; create policy official_templates_staff_all on public.official_templates for all to authenticated using (private.is_staff()) with check (private.is_staff());
grant select, insert, update, delete on public.licenses, public.trainings, public.training_attendance, public.equipment_authorizations, public.training_matrix, public.competency, public.official_templates to authenticated;
revoke all on public.licenses, public.trainings, public.training_attendance, public.equipment_authorizations, public.training_matrix, public.competency, public.official_templates from anon;
