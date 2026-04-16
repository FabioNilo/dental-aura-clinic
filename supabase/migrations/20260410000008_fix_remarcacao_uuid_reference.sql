create or replace function public.remarcar_solicitacao_agendamento(
  p_solicitacao_id uuid,
  p_observacoes_admin text default null,
  p_data_hora timestamptz default null,
  p_profissional_id uuid default null,
  p_servico_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_solicitacao public.solicitacoes_agendamento%rowtype;
  v_data_hora_anterior timestamptz;
  v_data_hora_local timestamp;
  v_descricao_atividade text;
  v_nota_automatica text;
  v_observacoes_admin_atuais text;
  v_observacoes_admin_novas text;
  v_turno public.solicitacoes_agendamento.turno_desejado%type;
  v_vai_atualizar_agendamento boolean;
begin
  select *
  into v_solicitacao
  from public.solicitacoes_agendamento
  where id = p_solicitacao_id
  for update;

  if not found then
    raise exception 'Solicitacao nao encontrada.';
  end if;

  if p_data_hora is not null and p_data_hora <= now() then
    raise exception 'A nova data precisa estar no futuro.';
  end if;

  select a.data_hora
  into v_data_hora_anterior
  from public.agendamentos a
  where a.id = v_solicitacao.agendamento_id;

  v_data_hora_anterior := coalesce(v_solicitacao.data_hora_confirmada, v_data_hora_anterior);
  v_observacoes_admin_atuais := nullif(trim(coalesce(v_solicitacao.observacoes_admin, '')), '');
  v_observacoes_admin_novas := nullif(trim(coalesce(p_observacoes_admin, '')), '');

  if v_observacoes_admin_novas is not null and v_observacoes_admin_novas = v_observacoes_admin_atuais then
    v_observacoes_admin_novas := null;
  end if;

  if p_data_hora is not null then
    v_data_hora_local := timezone('America/Sao_Paulo', p_data_hora);
    v_turno := case
      when extract(hour from v_data_hora_local) < 12 then 'manha'
      when extract(hour from v_data_hora_local) < 18 then 'tarde'
      else 'noite'
    end;
  else
    v_turno := v_solicitacao.turno_desejado;
  end if;

  v_vai_atualizar_agendamento := v_solicitacao.agendamento_id is not null
    and (
      p_data_hora is not null
      or p_profissional_id is not null
      or p_servico_id is not null
    );

  if v_vai_atualizar_agendamento then
    update public.agendamentos
    set
      data_hora = coalesce(p_data_hora, data_hora),
      profissional_id = coalesce(p_profissional_id, profissional_id),
      servico_id = coalesce(p_servico_id, servico_id),
      updated_at = now()
    where id = v_solicitacao.agendamento_id;
  end if;

  v_nota_automatica := case
    when p_data_hora is not null then
      concat(
        '[Remarcacao registrada em ',
        to_char(timezone('America/Sao_Paulo', now()), 'DD/MM/YYYY HH24:MI'),
        '] Data anterior: ',
        coalesce(to_char(timezone('America/Sao_Paulo', v_data_hora_anterior), 'DD/MM/YYYY HH24:MI'), 'nao informada'),
        '. Nova data proposta: ',
        to_char(v_data_hora_local, 'DD/MM/YYYY HH24:MI'),
        case
          when v_vai_atualizar_agendamento then '. Agendamento vinculado atualizado.'
          else '.'
        end
      )
    else
      concat(
        '[Remarcacao registrada em ',
        to_char(timezone('America/Sao_Paulo', now()), 'DD/MM/YYYY HH24:MI'),
        '] Remarcacao solicitada sem nova data definida.',
        case
          when v_vai_atualizar_agendamento then ' Agendamento vinculado atualizado.'
          else ''
        end
      )
  end;

  update public.solicitacoes_agendamento
  set
    data_hora_confirmada = coalesce(p_data_hora, data_hora_confirmada),
    dia_desejado = case
      when p_data_hora is not null then v_data_hora_local::date
      else dia_desejado
    end,
    observacoes_admin = concat_ws(
      E'\n\n',
      v_observacoes_admin_atuais,
      v_observacoes_admin_novas,
      v_nota_automatica
    ),
    profissional_id = coalesce(p_profissional_id, profissional_id),
    servico_id = coalesce(p_servico_id, servico_id),
    status = case
      when p_data_hora is not null then 'aguardando_confirmacao'
      else 'remarcacao_solicitada'
    end,
    turno_desejado = case
      when p_data_hora is not null then v_turno
      else turno_desejado
    end,
    updated_at = now()
  where id = p_solicitacao_id;

  v_descricao_atividade := case
    when p_data_hora is not null then
      concat(
        v_solicitacao.nome_cliente,
        ' recebeu nova proposta para ',
        to_char(v_data_hora_local, 'DD/MM HH24:MI'),
        '.'
      )
    else
      concat(v_solicitacao.nome_cliente, ' entrou em remarcacao sem nova data definida.')
  end;

  insert into public.atividades (tipo, titulo, descricao, referencia_id)
  values (
    'solicitacao_remarcacao',
    'Solicitacao remarcada',
    v_descricao_atividade,
    p_solicitacao_id
  );

  return p_solicitacao_id::text;
end;
$$;
