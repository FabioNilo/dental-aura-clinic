drop function if exists public.rpc_overview_kpis();
drop function if exists public.rpc_overview_chart_semana();
drop function if exists public.rpc_financeiro_resumo(date, date, uuid);
drop function if exists public.rpc_financeiro_devedores(integer, uuid);

create or replace function public.rpc_overview_kpis()
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
      from public.pacientes
      where ativo = true
    ) as total_pacientes,
    (
      select count(*)
      from public.solicitacoes_agendamento sa
      cross join today_bounds tb
      where sa.created_at >= tb.start_at
        and sa.created_at < tb.end_at
    ) as solicitacoes_hoje,
    (
      select count(*)
      from public.solicitacoes_agendamento sa
      cross join today_bounds tb
      where sa.canal_origem = 'n8n'
        and sa.status = 'agendado'
        and sa.updated_at >= tb.start_at
        and sa.updated_at < tb.end_at
    ) as confirmacoes_ia_hoje,
    (
      select count(*)
      from public.solicitacoes_agendamento
      where status in (
        'novo',
        'em_triagem',
        'aguardando_confirmacao',
        'remarcacao_solicitada',
        'cancelamento_solicitado'
      )
    ) as pendencias_operacionais;
$$;

create or replace function public.rpc_overview_chart_semana()
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
  left join public.solicitacoes_agendamento sa
    on sa.created_at >= series.ref_date::timestamp
    and sa.created_at < (series.ref_date + interval '1 day')::timestamp
  group by series.ref_date
  order by series.ref_date;
$$;

create or replace function public.rpc_financeiro_resumo(
  p_data_inicio date,
  p_data_fim date,
  p_paciente_id uuid default null
)
returns table (
  periodo_inicio date,
  periodo_fim date,
  total_faturado numeric,
  total_recebido numeric,
  total_pendente numeric,
  total_vencido numeric,
  total_desconto_aplicado numeric,
  quantidade_faturas bigint,
  quantidade_faturas_pagas bigint,
  quantidade_faturas_pendentes bigint,
  taxa_recebimento numeric
)
language sql
stable
as $$
  with filtered_faturas as (
    select
      f.id,
      f.data_vencimento,
      f.desconto_valor,
      f.status,
      f.valor_pago,
      f.valor_total
    from public.faturas f
    where f.data_emissao >= p_data_inicio
      and f.data_emissao <= p_data_fim
      and (p_paciente_id is null or f.paciente_id = p_paciente_id)
  ),
  filtered_pagamentos as (
    select
      p.valor
    from public.pagamentos p
    join public.faturas f on f.id = p.fatura_id
    where p.data_pagamento >= p_data_inicio
      and p.data_pagamento <= p_data_fim
      and (p_paciente_id is null or f.paciente_id = p_paciente_id)
  )
  select
    p_data_inicio as periodo_inicio,
    p_data_fim as periodo_fim,
    coalesce(sum(ff.valor_total), 0) as total_faturado,
    coalesce((select sum(fp.valor) from filtered_pagamentos fp), 0) as total_recebido,
    coalesce(sum(ff.valor_total - coalesce(ff.valor_pago, 0)), 0) as total_pendente,
    coalesce(
      sum(
        case
          when ff.data_vencimento is not null
            and ff.data_vencimento < current_date
            and ff.status in ('emitida', 'parcialmente_paga')
          then ff.valor_total - coalesce(ff.valor_pago, 0)
          else 0
        end
      ),
      0
    ) as total_vencido,
    coalesce(sum(coalesce(ff.desconto_valor, 0)), 0) as total_desconto_aplicado,
    count(*) as quantidade_faturas,
    count(*) filter (where ff.status = 'paga') as quantidade_faturas_pagas,
    count(*) filter (where ff.status <> 'paga') as quantidade_faturas_pendentes,
    case
      when coalesce(sum(ff.valor_total), 0) > 0
        then (
          coalesce((select sum(fp.valor) from filtered_pagamentos fp), 0)
          / sum(ff.valor_total)
        ) * 100
      else 0
    end as taxa_recebimento
  from filtered_faturas ff;
$$;

create or replace function public.rpc_financeiro_devedores(
  p_limit integer default 20,
  p_paciente_id uuid default null
)
returns table (
  paciente_id uuid,
  nome text,
  email text,
  telefone text,
  total_devido numeric,
  dias_atraso integer,
  quantidade_faturas_vencidas bigint
)
language sql
stable
as $$
  with overdue_faturas as (
    select
      f.data_vencimento,
      f.paciente_id,
      (f.valor_total - coalesce(f.valor_pago, 0)) as saldo
    from public.faturas f
    where f.status in ('emitida', 'parcialmente_paga')
      and f.data_vencimento is not null
      and f.data_vencimento < current_date
      and (p_paciente_id is null or f.paciente_id = p_paciente_id)
  )
  select
    p.id as paciente_id,
    p.nome,
    p.email,
    p.telefone,
    coalesce(sum(of.saldo), 0) as total_devido,
    coalesce(max(current_date - of.data_vencimento), 0)::integer as dias_atraso,
    count(*) as quantidade_faturas_vencidas
  from overdue_faturas of
  join public.pacientes p on p.id = of.paciente_id
  group by p.id, p.nome, p.email, p.telefone
  order by total_devido desc
  limit greatest(coalesce(p_limit, 20), 1);
$$;
