-- ============================================================================
-- Clinic overview RPCs for the n8n migration
-- ============================================================================

create or replace function clinic.rpc_overview_kpis()
returns table (
  total_pacientes bigint,
  solicitacoes_hoje bigint,
  confirmacoes_ia_hoje bigint,
  pendencias_operacionais bigint
)
language sql
stable
as $$
  with today_bounds as (
    select
      date_trunc('day', now()) as start_at,
      date_trunc('day', now()) + interval '1 day' as end_at
  )
  select
    (
      select count(*)
      from clinic.pacientes
      where ativo = true
    ) as total_pacientes,
    (
      select count(*)
      from clinic.solicitacoes_agendamento sa
      cross join today_bounds tb
      where sa.created_at >= tb.start_at
        and sa.created_at < tb.end_at
    ) as solicitacoes_hoje,
    (
      select count(*)
      from clinic.solicitacoes_agendamento sa
      cross join today_bounds tb
      where sa.canal_origem = 'n8n'
        and sa.status = 'agendado'
        and sa.updated_at >= tb.start_at
        and sa.updated_at < tb.end_at
    ) as confirmacoes_ia_hoje,
    (
      select count(*)
      from clinic.solicitacoes_agendamento
      where status in (
        'novo',
        'em_triagem',
        'aguardando_confirmacao',
        'remarcacao_solicitada',
        'cancelamento_solicitado'
      )
    ) as pendencias_operacionais;
$$;

create or replace function clinic.rpc_overview_chart_semana()
returns table (
  day text,
  value bigint
)
language sql
stable
as $$
  with series as (
    select generate_series(current_date - interval '6 day', current_date, interval '1 day')::date as ref_date
  )
  select
    to_char(series.ref_date, 'DD/MM') as day,
    count(sa.id) as value
  from series
  left join clinic.solicitacoes_agendamento sa
    on sa.created_at >= series.ref_date::timestamp
    and sa.created_at < (series.ref_date + interval '1 day')::timestamp
  group by series.ref_date
  order by series.ref_date;
$$;
