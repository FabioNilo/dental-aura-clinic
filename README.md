# Dental Aura Clinic

MVP operacional de uma clinica odontologica com:

- landing institucional
- painel admin autenticado com Supabase Auth
- fila de `solicitacoes_agendamento`
- confirmacao manual que gera `agendamentos`
- base pronta para atendimento virtual via n8n

## Fonte de verdade

O repositorio passa a ser a fonte oficial do schema.

As migrations locais em `supabase/migrations` agora cobrem:

- `pacientes`
- `profissionais`
- `servicos`
- `agendamentos`
- `atividades`
- `user_roles`
- `solicitacoes_agendamento`
- RLS, policies e funcoes auxiliares

## Rotas principais

- `/` - Landing page
- `/admin/login` - Acesso admin
- `/admin` - Dashboard admin
- `/admin/solicitacoes` - Fila de solicitações
- `/admin/financeiro` - 🆕 Módulo Financeiro (v1.0)

## Setup recomendado

1. Aplicar as migrations no projeto Supabase.
2. Criar um usuario no Supabase Auth.
3. Dar role admin ao usuario:

```sql
insert into public.user_roles (user_id, role)
values ('SEU-USER-ID', 'admin');
```

4. Configurar o n8n com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

## Dados de desenvolvimento

O repositório agora inclui um seed operacional em `supabase/seed.sql` com:

- pacientes
- profissionais
- servicos
- solicitacoes em varios status
- proximos agendamentos
- atividades recentes

Para ambiente local com Supabase CLI:

```bash
supabase db reset
```

Esse comando reaplica as migrations e carrega automaticamente o `supabase/seed.sql`.

Se voce quiser popular um banco remoto/manualmente, execute o conteudo de `supabase/seed.sql` no SQL Editor depois das migrations.

Observacao:

- o seed nao cria usuarios em `auth.users`
- a role `admin` em `public.user_roles` continua sendo um passo manual do setup

## Contrato do atendimento virtual

O n8n v1 deve:

1. identificar o telefone
2. localizar ou criar o paciente com `upsert_paciente_por_telefone`
3. gravar a entrada em `public.solicitacoes_agendamento`
4. nao reservar horario automaticamente

Documentacao complementar:

- `docs/etapa-1-expansao-n8n-clinica.md`
- `docs/n8n-atendimento-clinica-v1.md`
- `Atendimento Ajuste.json`

## 🆕 Módulo Financeiro (v1.0)

### Overview

O módulo financeiro de **gestão integrada de orçamentos, faturas, pagamentos e relatórios** foi implementado em sua totalidade. Inclui:

- ✅ Dashboard com KPIs em tempo real
- ✅ Gestão de orçamentos (com workflow de aceitar/rejeitar)
- ✅ Gestão de faturas (com registro de pagamentos)
- ✅ Sistema de descontos com cupons
- ✅ Relatórios avançados com 4 tipos diferentes
- ✅ Exportação CSV de todos os relatórios

### Rotas & Abas

`/admin/financeiro`

1. **Dashboard** - KPIs financeiros, período customizável, export
2. **Orçamentos** - Criar, listar, aceitar/rejeitar orçamentos
3. **Faturas** - Gestão de faturas, registro de pagamentos
4. **Relatórios** - 4 tipos: Resumo, Devedores, Faturas, Mensalista
5. **Cupons** - Gestão de cupons desconto com limite de uso

### Database Schema

8 tabelas principais:
- `servicos` - Tabela de preços
- `orcamentos` - Orçamentos/cotações
- `orcamento_itens` - Itens do orçamento
- `faturas` - Faturas emitidas
- `fatura_itens` - Itens da fatura
- `pagamentos` - Registros de pagamento
- `cupons_desconto` - Cupons e descontos
- `cupom_uso` - Audit log de cupons

Todas com RLS ativo e índices de performance.

### Features Principais

#### Dashboard Financeiro
- Cards com totais (Faturado, Recebido, Pendente, Vencido)
- Filter por período customizável
- Estatísticas: Taxa de Recebimento, Quantidade de Faturas, Pagas/Pendentes
- Tabela de devedores (pacientes com débito)
- Export CSV

#### Relatórios Avançados

**1. Resumo Financeiro**
- Total faturado, recebido, pendente, vencido
- Taxa de recebimento (%)
- Desconto total aplicado
- Estatísticas gerais

**2. Devedores**
- Pacientes com débito ativo
- Dias em atraso
- Quantidade de faturas vencidas
- Status automático (Crítico/Atraso/OK)

**3. Faturas**
- Lista de todas as faturas
- Filter por status e período
- Valor total, pago e saldo pendente
- Número NF, datas de emissão e vencimento

**4. Mensalista** (Placeholder)
- Preparado para clientes com cobrança recorrente

### API Layer

25+ React Query hooks para:
- Serviços (CRUD)
- Orçamentos (CRUD + conversão para fatura)
- Faturas (CRUD + gestão de pagamentos)
- Pagamentos (registro, queryagem)
- Cupons (CRUD + validação)
- Relatórios (período, devedores)

### Instruções de Uso

#### Testar Localmente
```bash
npm run dev
# Acesse http://localhost:5173/admin/financeiro
```

#### Deploy
```bash
npm run build
# Verifica se compila sem erros
```

### Documentação Complementar

- `docs/MODULO_FINANCEIRO_OVERVIEW.md` - Visão arquitetural completa
- `docs/TESTING_RELATORIOS.md` - Guia de testes funcional passo-a-passo
- `docs/VALIDACAO_PRE_DEPLOY.md` - Checklist de validação pré-deployment

### Status & Próximos Passos

✅ **Status:** Beta (Pronto para testes e validação)

Futuros aprimoramentos:
- [ ] Gráficos avançados (linhas, colunas, pizza)
- [ ] Export PDF
- [ ] Integração com payment gateway (Stripe/PIX)
- [ ] Notificações automáticas de vencimento
- [ ] Relatórios mensais/anuais
- [ ] Mobile app nativa
