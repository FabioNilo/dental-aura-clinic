-- ============================================================================
-- Clinic auth bridge and patient upsert helpers for the n8n migration
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'auth') then
    raise exception 'Esta migration e exclusiva do Supabase e depende do schema auth. Para o PostgreSQL dedicado do Dental Aura, rode n8n/dental/00-infra/dental-aura-postgres-schema.sql.';
  end if;
end;
$$;

create unique index if not exists uq_clinic_pacientes_telefone_normalizado
  on clinic.pacientes (telefone_normalizado);

create or replace function clinic.normalize_phone(p_telefone text)
returns text
language plpgsql
immutable
as $$
declare
  v_telefone text;
begin
  v_telefone := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');

  if v_telefone = '' then
    raise exception 'Telefone obrigatorio.';
  end if;

  return v_telefone;
end;
$$;

create or replace function clinic.upsert_paciente_por_telefone(
  p_nome text,
  p_telefone text
)
returns uuid
language plpgsql
security definer
set search_path = clinic, public
as $$
declare
  v_id uuid;
  v_nome text;
  v_telefone_normalizado text;
begin
  v_nome := nullif(btrim(coalesce(p_nome, '')), '');
  v_telefone_normalizado := clinic.normalize_phone(p_telefone);

  insert into clinic.pacientes (
    nome,
    telefone,
    telefone_normalizado,
    ativo
  )
  values (
    coalesce(v_nome, 'Paciente sem nome'),
    p_telefone,
    v_telefone_normalizado,
    true
  )
  on conflict (telefone_normalizado)
  do update
    set nome = coalesce(nullif(excluded.nome, ''), clinic.pacientes.nome),
        telefone = excluded.telefone,
        telefone_normalizado = excluded.telefone_normalizado,
        ativo = true,
        updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

drop policy if exists "clinic_access_roles_select_authenticated" on clinic.access_roles;

create policy "clinic_access_roles_select_own_record" on clinic.access_roles
  for select using (
    auth.role() = 'authenticated'
    and (
      supabase_user_id = auth.uid()
      or email = auth.email()
    )
  );
