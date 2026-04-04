# 🚀 Quick Start - Módulo Financeiro

## ⚡ 5 Minutos para Começar

### 1️⃣ Verificar se está rodando

```bash
# Terminal 1: Backend rodando?
npm run dev
# Deve abrir em http://localhost:5173

# Terminal 2: Supabase conectado?
# Verificar no painel https://app.supabase.com
```

### 2️⃣ Acessar módulo

```
http://localhost:5173/admin/financeiro
```

**Login necessário:**
- Email: (seu email testador)
- Password: (sua senha de teste)

### 3️⃣ Explorar as 5 abas

```
┌─────────────┬──────────┬─────────┬─────────┬─────────┐
│ Dashboard   │Orçam.    │ Faturas │Relat.   │ Cupons  │
├─────────────┼──────────┼─────────┼─────────┼─────────┤
│ KPIs reais  │ Criar/   │ Listar  │ 4 tipos │ Gestão  │
│ Filtro per. │ Aceitar  │ Pagtos  │ Export  │ de      │
│ Export CSV  │ Converter│         │         │ cupons  │
└─────────────┴──────────┴─────────┴─────────┴─────────┘
```

### 4️⃣ Testar Flow Básico

#### Cenário: Criar Orçamento → Fatura → Pagamento

**Passo 1: Dashboard**
- Vê KPIs iniciais
- Filtra por período
- Clica "Exportar CSV"

**Passo 2: Orçamentos**
- Clica "Novo Orçamento"
- Seleciona paciente
- Adiciona serviços
- Salva como "Rascunho"

**Passo 3: Converter para Fatura**
- Volta à aba Orçamentos
- Seleciona orçamento criado
- Clica "Converter em Fatura"
- Número NF é auto-gerado

**Passo 4: Registrar Pagamento**
- Vai à aba Faturas
- Seleciona fatura criada
- Clica "Registrar Pagamento"
- Preenche valor e método
- Salva

**Passo 5: Verificar Relatório**
- Volta ao Dashboard
- Vê valores atualizados
- Taxa de Recebimento mudou
- Paciente não aparece mais em "Devedores" se pagou tudo

---

## 📋 Checklists por Tarefa

### ✅ Tarefa: Criar Orçamento

1. [ ] Dashboard → Orçamentos
2. [ ] Clique "Novo Orçamento"
3. [ ] Selecione paciente (dropdown)
4. [ ] Adicione item (serviço + quantidade)
5. [ ] Clique "+ Adicionar Item" se precisar
6. [ ] Salve como rascunho
7. [ ] Volte à lista de orçamentos
8. [ ] Verifique novo orçamento na tabela
9. [ ] Status = "rascunho"

### ✅ Tarefa: Enviar Orçamento

1. [ ] Aba Orçamentos
2. [ ] Busque orçamento em "rascunho"
3. [ ] Clique no orçamento
4. [ ] Mude status para "enviado"
5. [ ] Salve

### ✅ Tarefa: Aceitar Orçamento

1. [ ] Selecione orçamento em status "enviado"
2. [ ] Clique "Aceitar"
3. [ ] Confirmação aparece
4. [ ] Status muda para "aceito"

### ✅ Tarefa: Converter em Fatura

1. [ ] Orçamento em status "aceito"
2. [ ] Clique "Converter em Fatura"
3. [ ] Fatura criada automaticamente
4. [ ] Número NF é gerado
5. [ ] Verifique em → Faturas (aba 3)

### ✅ Tarefa: Registrar Pagamento

1. [ ] Aba Faturas
2. [ ] Selecione fatura "emitida"
3. [ ] Clique "Registrar Pagamento"
4. [ ] Preencha:
   - Valor pagado
   - Data pagamento
   - Método (Dinheiro/PIX/Cartão/etc)
5. [ ] Clique "Registrar"
6. [ ] Status da fatura muda para "parcialmente_paga" ou "paga"

### ✅ Tarefa: Gerar Relatório

1. [ ] Aba Relatórios
2. [ ] Selecione tipo:
   - Resumo Financeiro
   - Devedores
   - Faturas
   - Mensalista
3. [ ] Ajuste período (data início/fim)
4. [ ] Clique "Exportar CSV"
5. [ ] Arquivo baixado com nome datado

---

## 🎯 Exemplos de Uso Real

### Exemplo 1: Clínica com Demanda Mensal

**Flow típico:**

```
1. Paciente liga → Solicitação de agendamento
2. Após atendimento → Admin cria Orçamento
3. Paciente aprova → Muda status "enviado" → "aceito"
4. Admin converte → Cria Fatura
5. Paciente paga → Admin registra pagamento
6. Fim do mês → Gera relatório de "Resumo Financeiro"
7. Analisa: % de recebimento, devedores, etc.
```

### Exemplo 2: Análise de Devedores

**Cenário:** Mês fechado, precisa saber quem deve

```
1. Aba Relatórios
2. Tipo = "Devedores"
3. Data Início = 1º do mês anterior
4. Data Fim = último dia do mês anterior
5. Visualiza:
   - Pacientes com débito
   - Dias em atraso
   - Status (Crítico se > 30 dias)
6. Exporta CSV para WhatsApp/Email
```

### Exemplo 3: Controle Monthly

**Tarefa:** Validar faturamento vs recebimento

```
1. Aba Relatórios
2. Tipo = "Resumo Financeiro"
3. Período = Mês atual
4. Lê:
   - Total Faturado = R$ 15.000
   - Total Recebido = R$ 10.000
   - Total Pendente = R$ 5.000
   - Taxa de Recebimento = 66%
5. Exporta para apresentação ao sócio
```

---

## 🔧 Troubleshooting Rápido

### ❓ "Dashboard vazio / sem dados"

1. Verificar se há faturas criadas no banco
   ```sql
   -- Em Supabase SQL Editor:
   SELECT COUNT(*) FROM faturas;
   ```

2. Se 0 faturas, criar dados de teste:
   - Ir para Orçamentos
   - Criar novo orçamento
   - Converter para fatura
   - Registrar pagamento

3. Se ainda vazio, verificar console:
   - Pressione F12
   - Vá à aba Console
   - Procure por erros vermelhos

### ❓ "Filtro de período não funciona"

1. Verifique se as datas estão no formato correto: `YYYY-MM-DD`
2. Clique em outro tipo de relatório e volte
3. Recarregue a página (F5)

### ❓ "Export CSV não baixa"

1. Verificar se há bloqueador de popup
2. Permitir popups para: `localhost:5173`
3. Tentar com outro browser (Chrome/Firefox)

### ❓ "Status não muda depois de salvar"

1. Aguarde 2 segundos (React Query refetch)
2. Recarregue a página (F5)
3. Verifique console (F12) por erros

---

## 📊 Dados de Teste Recomendados

Antes de usar em produção, crie esses dados:

### 3 Pacientes
```
- João Silva (celular: 11-99999-0001)
- Maria Santos (celular: 11-99999-0002)
- Pedro Oliveira (celular: 11-99999-0003)
```

### 5 Serviços
```
- Limpeza: R$ 150
- Restauração: R$ 300
- Clareamento: R$ 500
- Implante: R$ 2.000
- Ortodontia (consulta): R$ 200
```

### 3 Orçamentos (diferentes status)
```
1. Para João (rascunho)
2. Para Maria (enviado)
3. Para Pedro (aceito)
```

### 2 Faturas
```
1. De Pedro - convertida de orçamento (sem pagamento)
2. Outra fatura - com pagamento registrado
```

---

## 🎓 Atualizar Conhecimento

### Ler para entender melhor:

1. **Visão Geral** (5 min)
   - `docs/MODULO_FINANCEIRO_OVERVIEW.md`

2. **Testar Tudo** (30 min)
   - `docs/TESTING_RELATORIOS.md`

3. **Validação Completa** (20 min)
   - `docs/VALIDACAO_PRE_DEPLOY.md`

4. **Schema Database** (10 min)
   - `DATABASE_SETUP.md` (seção Financeiro)

---

## 🚀 Próximas Ações

### Hoje
- [ ] Acessar `/admin/financeiro`
- [ ] Explorar as 5 abas
- [ ] Ficar confortável com navegação

### Esta Semana
- [ ] Seguir teste passo-a-passo (TESTING_RELATORIOS.md)
- [ ] Criar dados de teste
- [ ] Testar end-to-end flow

### Este Mês
- [ ] Usar em produção com pequena demanda
- [ ] Coletar feedback para versão 1.1
- [ ] Planejar features futuras

---

## 💬 Dúvidas Frequentes

**P: Posso usar em produção agora?**  
R: Sim! Status é Beta, significa funcional mas precisaria testar mais em dados reais.

**P: E se der erro?**  
R: Todos os dados são salváveis em Supabase. Errors não deletam dados. F12 → Console para ver detalhes técnicos.

**P: Como fazer backup?**  
R: Supabase faz automaticamente. Você também pode: Dashboard Supabase → Backups

**P: Posso integrar com PayPal/Stripe?**  
R: Sim, no futuro. Agora é manual (registrar pagamento).

**P: E relatórios avançados (gráficos)?**  
R: Na versão 1.1 (próximas semanas). Agora temos CSV que abre em Excel.

---

## 🏁 Você está pronto!

Comece agora acessando:

```
http://localhost:5173/admin/financeiro
```

Boa sorte! 🎉
