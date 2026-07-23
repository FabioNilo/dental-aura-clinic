-- Dental Aura SaaS PostgreSQL schema
-- Target architecture: React/Vite -> n8n Webhooks -> dedicated PostgreSQL.
-- Do not run this against the internal n8n database.

create schema if not exists dental_platform;
create schema if not exists dental_clinic;

create extension if not exists pgcrypto;

create table if not exists dental_platform.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  document text,
  email text,
  phone text,
  city text,
  plan text not null default 'starter' check (plan in ('starter', 'growth', 'enterprise')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dental_platform.platform_users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null unique,
  password_hash text not null,
  role text not null default 'platform_admin' check (role = 'platform_admin'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dental_platform.platform_sessions (
  token text primary key,
  user_id uuid not null references dental_platform.platform_users(id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists dental_clinic.users (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  name text,
  email text not null,
  password_hash text not null,
  role text not null default 'clinic_admin' check (role in ('clinic_admin', 'clinic_staff', 'dentist')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, email)
);

create table if not exists dental_clinic.sessions (
  token text primary key,
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  user_id uuid not null references dental_clinic.users(id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists dental_clinic.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  nome text not null,
  cpf text,
  telefone text,
  telefone_normalizado text,
  email text,
  data_nascimento date,
  endereco text,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, telefone_normalizado)
);

create table if not exists dental_clinic.professionals (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  nome text not null,
  especialidade text,
  cro text,
  telefone text,
  email text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dental_clinic.services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  nome text not null,
  descricao text,
  categoria text,
  preco numeric(10, 2) not null default 0,
  duracao_minutos integer,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dental_clinic.requests (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  codigo_externo text not null,
  status text not null default 'novo',
  origem text not null default 'manual',
  canal_origem text not null default 'n8n',
  patient_id uuid references dental_clinic.patients(id) on delete set null,
  appointment_id uuid,
  professional_id uuid references dental_clinic.professionals(id) on delete set null,
  service_id uuid references dental_clinic.services(id) on delete set null,
  nome_cliente text not null,
  telefone_cliente text not null,
  procedimento_nome text not null default 'Consulta geral',
  tipo_atendimento text,
  dia_desejado date,
  horario_desejado time,
  data_hora_confirmada timestamptz,
  observacoes_cliente text,
  observacoes_admin text,
  payload_externo jsonb not null default '{}'::jsonb,
  resumo_atendimento jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, codigo_externo)
);

create table if not exists dental_clinic.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  patient_id uuid not null references dental_clinic.patients(id) on delete cascade,
  professional_id uuid not null references dental_clinic.professionals(id) on delete restrict,
  service_id uuid references dental_clinic.services(id) on delete set null,
  data_hora timestamptz not null,
  duracao_minutos integer,
  status text not null default 'confirmado',
  origem text not null default 'solicitacao',
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'dental_requests_appointment_fkey'
      and conrelid = 'dental_clinic.requests'::regclass
  ) then
    alter table dental_clinic.requests
      add constraint dental_requests_appointment_fkey
      foreign key (appointment_id) references dental_clinic.appointments(id) on delete set null;
  end if;
end;
$$;

create table if not exists dental_clinic.activities (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  descricao text,
  referencia_id text,
  created_at timestamptz not null default now()
);

create table if not exists dental_clinic.budgets (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  patient_id uuid not null references dental_clinic.patients(id) on delete cascade,
  record_id uuid,
  data_emissao date not null default current_date,
  data_validade date,
  status text not null default 'rascunho',
  valor_total numeric(12, 2) not null default 0,
  desconto_tipo text,
  desconto_valor numeric(12, 2) not null default 0,
  observacoes text,
  created_by uuid references dental_clinic.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dental_clinic.budget_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  budget_id uuid not null references dental_clinic.budgets(id) on delete cascade,
  treatment_id uuid,
  service_id uuid references dental_clinic.services(id) on delete set null,
  descricao text not null,
  preco_unitario numeric(12, 2) not null default 0,
  quantidade numeric(10, 2) not null default 1,
  subtotal numeric(12, 2) generated always as (preco_unitario * quantidade) stored,
  created_at timestamptz not null default now()
);

create table if not exists dental_clinic.invoices (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  patient_id uuid references dental_clinic.patients(id) on delete set null,
  record_id uuid,
  budget_id uuid references dental_clinic.budgets(id) on delete set null,
  numero_nf text,
  status text not null default 'pendente',
  data_emissao date not null default current_date,
  data_vencimento date,
  valor_total numeric(12, 2) not null default 0,
  valor_pago numeric(12, 2) not null default 0,
  desconto_tipo text,
  desconto_valor numeric(12, 2) not null default 0,
  observacoes text,
  metodo_pagamento_default text,
  created_by uuid references dental_clinic.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dental_clinic.invoice_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  invoice_id uuid not null references dental_clinic.invoices(id) on delete cascade,
  treatment_id uuid,
  service_id uuid references dental_clinic.services(id) on delete set null,
  descricao text not null,
  preco_unitario numeric(12, 2) not null default 0,
  quantidade numeric(10, 2) not null default 1,
  subtotal numeric(12, 2) generated always as (preco_unitario * quantidade) stored,
  created_at timestamptz not null default now()
);

create table if not exists dental_clinic.payments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  invoice_id uuid not null references dental_clinic.invoices(id) on delete cascade,
  amount numeric(12, 2) not null,
  method text,
  reference text,
  notes text,
  registered_by uuid references dental_clinic.users(id) on delete set null,
  paid_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists dental_clinic.records (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  patient_id uuid not null references dental_clinic.patients(id) on delete cascade,
  appointment_id uuid references dental_clinic.appointments(id) on delete set null,
  professional_id uuid references dental_clinic.professionals(id) on delete set null,
  queixa_principal text,
  diagnostico text,
  plano_tratamento text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dental_clinic.treatments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  record_id uuid not null references dental_clinic.records(id) on delete cascade,
  patient_id uuid references dental_clinic.patients(id) on delete cascade,
  service_id uuid references dental_clinic.services(id) on delete set null,
  service_name text,
  tooth_number text,
  procedure_description text not null,
  status text not null default 'diagnostico',
  diagnosis_date date,
  budget_date date,
  scheduled_date date,
  total_sessions integer,
  completed_sessions integer not null default 0,
  session_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dental_clinic.discount_coupons (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  codigo text not null,
  descricao text,
  tipo text not null default 'percentual',
  valor numeric(12, 2) not null default 0,
  validade_inicio date not null default current_date,
  validade_fim date,
  uso_maximo integer,
  uso_atual integer not null default 0,
  ativo boolean not null default true,
  created_by uuid references dental_clinic.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, codigo)
);

create table if not exists dental_clinic.coupon_uses (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references dental_platform.clinics(id) on delete cascade,
  coupon_id uuid not null references dental_clinic.discount_coupons(id) on delete cascade,
  invoice_id uuid not null references dental_clinic.invoices(id) on delete cascade,
  used_at timestamptz not null default now()
);

create table if not exists dental_clinic.integration_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references dental_platform.clinics(id) on delete set null,
  source text not null,
  event_type text not null,
  external_id text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (source, external_id)
);

create index if not exists idx_dental_patients_clinic_name
  on dental_clinic.patients (clinic_id, nome);
create index if not exists idx_dental_appointments_clinic_date
  on dental_clinic.appointments (clinic_id, data_hora);
create index if not exists idx_dental_requests_clinic_status
  on dental_clinic.requests (clinic_id, status, created_at desc);
create index if not exists idx_dental_invoices_clinic_status
  on dental_clinic.invoices (clinic_id, status, data_vencimento);
create index if not exists idx_dental_budgets_clinic_patient
  on dental_clinic.budgets (clinic_id, patient_id, data_emissao desc);
create index if not exists idx_dental_treatments_clinic_patient
  on dental_clinic.treatments (clinic_id, patient_id, status);

insert into dental_platform.clinics (id, name, slug, plan, active)
values ('00000000-0000-4000-8000-000000000001', 'Clinica inicial', 'clinica-inicial', 'starter', true)
on conflict (slug) do nothing;
