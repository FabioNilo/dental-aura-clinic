do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'solicitacoes_agendamento'
      and column_name = 'horario_desejado'
  ) then
    alter table public.solicitacoes_agendamento
      add column horario_desejado time;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'solicitacoes_agendamento'
      and column_name = 'turno_desejado'
  ) then
    execute $sql$
      update public.solicitacoes_agendamento
      set horario_desejado = coalesce(
        horario_desejado,
        case
          when data_hora_confirmada is not null then timezone('America/Sao_Paulo', data_hora_confirmada)::time
          when turno_desejado = 'manha' then time '09:00:00'
          when turno_desejado = 'tarde' then time '14:00:00'
          when turno_desejado = 'noite' then time '19:00:00'
          when turno_desejado = 'comercial' then time '10:00:00'
          else null
        end
      )
    $sql$;

    alter table public.solicitacoes_agendamento
      drop column turno_desejado;
  end if;
end
$$;
