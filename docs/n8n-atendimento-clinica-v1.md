# n8n Atendimento Clinica v1

## Objetivo

Esse fluxo e o contrato minimo para o atendimento virtual da clinica.

Ele deve:

- receber a entrada do WhatsApp, chatbot ou frontend
- normalizar nome e telefone
- localizar ou criar o paciente pelo telefone
- salvar uma solicitacao em `public.solicitacoes_agendamento`
- devolver o `codigo_externo` para rastreio

Ele nao deve:

- reservar agenda automaticamente
- escolher profissional sozinho
- criar `agendamentos` diretamente

## Variaveis esperadas no n8n

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Payload minimo de entrada

```json
{
  "nome_cliente": "Maria Souza",
  "telefone_cliente": "11999998888",
  "procedimento_nome": "Consulta geral",
  "dia_desejado": "2026-04-04",
  "turno_desejado": "tarde",
  "origem": "whatsapp",
  "canal_origem": "n8n",
  "observacoes_cliente": "Dor no molar superior",
  "payload_externo": {
    "mensagem_original": "Quero marcar uma avaliacao"
  },
  "resumo_atendimento": {
    "intencao": "agendar_consulta",
    "canal": "whatsapp",
    "coletado_por": "ia"
  }
}
```

## Passos do fluxo

1. Validar `nome_cliente`, `telefone_cliente`, `procedimento_nome`, `dia_desejado` e `turno_desejado`.
2. Chamar `public.upsert_paciente_por_telefone`.
3. Inserir em `public.solicitacoes_agendamento` com:
   - `status = novo`
   - `origem = whatsapp` ou `site`
   - `canal_origem = n8n`
   - `paciente_id` retornado pela RPC
4. Responder com:
   - `ok`
   - `solicitacao_id`
   - `codigo_externo`

## Observacoes

- `codigo_externo` pode ser enviado pelo n8n, mas o banco tambem gera automaticamente via trigger.
- O fluxo ideal usa `service_role`, o que dispensa depender de policy publica para insercao.
- O admin e quem faz a confirmacao final no painel, usando a RPC `confirmar_solicitacao_agendamento`.
