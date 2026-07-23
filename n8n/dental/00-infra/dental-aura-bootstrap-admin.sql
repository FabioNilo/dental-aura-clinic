-- Bootstrap admins for Dental Aura SaaS.
-- Run this only on the dedicated Dental Aura PostgreSQL database.
-- Edit the values in the params CTE before execution.

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('dental_platform.clinics') is null
    or to_regclass('dental_platform.platform_users') is null
    or to_regclass('dental_clinic.users') is null then
    raise exception
      'Schema Dental Aura nao encontrado. Rode primeiro n8n/dental/00-infra/dental-aura-postgres-schema.sql no mesmo PostgreSQL dedicado.';
  end if;
end $$;

with params as (
  select
    '00000000-0000-4000-8000-000000000001'::uuid as initial_clinic_id,
    'Clinica inicial'::text as initial_clinic_name,
    'clinica-inicial'::text as initial_clinic_slug,

    'platform@dental-aura.local'::text as platform_admin_email,
    'Troque-Esta-Senha-Platform-2026!'::text as platform_admin_password,
    'Platform Admin'::text as platform_admin_name,

    'admin@clinica-inicial.local'::text as clinic_admin_email,
    'Troque-Esta-Senha-Clinica-2026!'::text as clinic_admin_password,
    'Admin Clinica Inicial'::text as clinic_admin_name
),
upsert_clinic as (
  insert into dental_platform.clinics (
    id,
    name,
    slug,
    plan,
    active
  )
  select
    initial_clinic_id,
    initial_clinic_name,
    initial_clinic_slug,
    'starter',
    true
  from params
  on conflict (slug)
  do update set
    name = excluded.name,
    active = true,
    updated_at = now()
  returning id
),
upsert_platform_admin as (
  insert into dental_platform.platform_users (
    name,
    email,
    password_hash,
    role,
    active
  )
  select
    platform_admin_name,
    lower(platform_admin_email),
    crypt(platform_admin_password, gen_salt('bf', 12)),
    'platform_admin',
    true
  from params
  on conflict (email)
  do update set
    name = excluded.name,
    password_hash = excluded.password_hash,
    role = 'platform_admin',
    active = true,
    updated_at = now()
  returning id, email
),
upsert_clinic_admin as (
  insert into dental_clinic.users (
    clinic_id,
    name,
    email,
    password_hash,
    role,
    active
  )
  select
    params.initial_clinic_id,
    params.clinic_admin_name,
    lower(params.clinic_admin_email),
    crypt(params.clinic_admin_password, gen_salt('bf', 12)),
    'clinic_admin',
    true
  from params
  on conflict (clinic_id, email)
  do update set
    name = excluded.name,
    password_hash = excluded.password_hash,
    role = 'clinic_admin',
    active = true,
    updated_at = now()
  returning id, clinic_id, email
)
select
  'bootstrap_ok' as status,
  (select email from upsert_platform_admin limit 1) as platform_admin_email,
  (select email from upsert_clinic_admin limit 1) as clinic_admin_email,
  (select clinic_id from upsert_clinic_admin limit 1) as clinic_id;
