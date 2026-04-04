# Teste de Relatórios Financeiros

## Pré-requisitos
- ✅ Banco de dados Supabase configurado
- ✅ Dados  de teste: pelo menos 3 faturas criadas
- ✅ aplicação rodando: `npm run dev`
- ✅ Acesso à conta admin

## Cenário 1: Testar Tab de Relatórios

### Passo 1: Navegação
1. Abrir browser em `http://localhost:5173/admin/financeiro`
2. Verifique se aparecem 5 abas: Dashboard, Orçamentos, Faturas, **Relatórios**, Cupons
3. Clique na aba **Relatórios** 

**Resultado esperado:** Aba de Relatórios carrega sem erros

### Passo 2: Interface de Filtros
- [ ] Verificar que aparecem 3 dropdowns/inputs:
  - "Tipo de Relatório" (Resumo, Devedores, Faturas, Mensalista)
  - "Data Início" (campo de data)
  - "Data Fim" (campo de data)
- [ ] Verificar que aparecem 2 botões:
  - "Exportar CSV" (ativo)
  - "Exportar PDF" (desabilitado com mensagem "em breve")

**Resultado esperado:** Interface renderiza corretamente

## Cenário 2: Testar Tipo "Resumo Financeiro"

### Passo 1: Selecionar Resumo
1. Tipo de Relatório = "Resumo Financeiro" (padrão)
2. Data Início = últimos 30 dias (padrão)
3. Data Fim = hoje (padrão)

### Passo 2: Verificar Cards
- [ ] Card 1: "Total Faturado" = valor em azul (deve ser > 0 se houver faturas)
- [ ] Card 2: "Total Recebido" = valor em verde (pode ser 0)
- [ ] Card 3: "Total Pendente" = valor em amarelo (faturado - recebido)
- [ ] Card 4: "Total Vencido" = valor em vermelho

### Passo 3: Verificar Indicadores
- [ ] "Taxa de Recebimento" = percentual (ex: 50%)
- [ ] "Quantidade de Faturas" = número
- [ ] "Faturas Pagas" = verde
- [ ] "Faturas Pendentes" = amarelo

**Resultado esperado:** Todos os cards mostram dados reais do banco

## Cenário 3: Testar Tipo "Devedores"

### Passo 1: Selecionar Devedores
1. Tipo de Relatório = "Devedores"
2. Clique em "Exportar CSV"

### Passo 2: Verificar Tabela
- [ ] Tabela com colunas:
  - Paciente ID
  - Total Devido
  - Dias em Atraso
  - Faturas Vencidas
  - Status (Crítico/Atraso/OK em badges coloridas)
  
### Passo 3: Verificar Status
- [ ] Pacientes com dias_atraso > 30 = Badge vermelha "Crítico"
- [ ] Pacientes com dias_atraso > 0 = Badge amarela "Atraso"
- [ ] Demais = Badge padrão "OK"

**Resultado esperado:** Devedores listados por total_devido (descendente)

## Cenário 4: Testar Tipo "Faturas"

### Passo 1: Selecionar Faturas
1. Tipo de Relatório = "Faturas"
2. Status = "Todos"
3. Data Início/Fim = mês atual

### Passo 2: Verificar Tabela
- [ ] Colunas aparecem: Número NF, Data Emissão, Vencimento, Status, Valor Total, Valor Pago, Saldo
- [ ] Badge de Status para cada fatura
- [ ] Saldo em vermelho (negrito) se > 0

### Passo 3: Testar Filter de Status
1. Status = "Pagas"
   - [ ] Mostra apenas faturas com status "paga"
2. Status = "Pendentes"
   - [ ] Mostra faturas não pagas
3. Status = "Canceladas"
   - [ ] Mostra apenas canceladas

**Resultado esperado:** Filtro funciona e limpa/atualiza a tabela

## Cenário 5: Testar Exportação CSV

### Passo 1: Exportar Resumo
1. Tipo = "Resumo Financeiro"
2. Clique "Exportar CSV"
3. Arquivo baixado: `relatorio-resumo-{data_inicio}-{data_fim}.csv`

### Passo 2: Verificar Conteúdo CSV
- [ ] Abrir arquivo em editor de texto
- [ ] Conteúdo esperado:
  ```
  RELATÓRIO FINANCEIRO - PERÍODO
  Período,2024-10-01 a 2024-11-01
  ---
  Total Faturado,R$ 5000.00
  Total Recebido,R$ 2500.00
  ...
  ```

### Passo 3: Exportar Devedores
1. Tipo = "Devedores"
2. Clique "Exportar CSV"
3. Arquivo: `relatorio-devedores-{data}.csv`
4. Verificar que contém todas as linhas da tabela

### Passo 4: Exportar Faturas
1. Tipo = "Faturas"
2. Clique "Exportar CSV"
3. Arquivo: `relatorio-faturas-{data_inicio}-{data_fim}.csv`
4. Verificar que contém todas as 7 colunas

**Resultado esperado:** Arquivos CSV válidos e abrem corretamente em Excel

## Cenário 6: Mudança de Período

### Passo 1: Alterar Datas
1. Tipo = "Resumo Financeiro"
2. Data Início = "2024-01-01"
3. Data Fim = "2024-12-31"
4. Aguarde 2 segundos (carregamento)

### Passo 2: Verificar Atualização
- [ ] Cards de resumo atualizam os valores
- [ ] Título mostra novo período
- [ ] Indicadores recalculam

**Resultado esperado:** UI responde dinamicamente a mudanças de período

## Cenário 7: Edge Cases

### Teste 1: Período sem dados
1. Tipo = "Resumo Financeiro"
2. Data Início = "2020-01-01"
3. Data Fim = "2020-01-31"

**Resultado esperado:** Valores mostram 0, sem erro

### Teste 2: Devedores vazio
1. Se não há devedores, mensagem: "Nenhum débito registrado"

**Resultado esperado:** Componente não queima (graceful degradation)

### Teste 3: Responsividade
1. Redimensione browser para 375px (mobile)
2. Verifique que:
   - [ ] Inputs de filtro se empilham
   - [ ] Tabelas ficam horizontalmente scrolláveis
   - [ ] Botões permanecem acessíveis

## ✅ Checklist Final

- [ ] Aba Relatórios carrega sem erro
- [ ] Tipo "Resumo" mostra dados reais
- [ ] Tipo "Devedores" lista corretamente
- [ ] Tipo "Faturas" com filtro funciona
- [ ] Exportação CSV de cada tipo funciona
- [ ] Período dinâmico atualiza UI
- [ ] Edge cases tratados
- [ ] Interface responsiva em mobile
- [ ] Nenhum erro no console browser
- [ ] Nenhum erro no console terminal

## Notas para Debugging

### Se dados não aparecerem:
1. Verificar Supabase console se há erros
2. Abrir DevTools F12 → Network → procurar por requisições `/functions`
3. Verificar se `useRelatorioFinanceiro` retorna dados

### Se exportação CSV não funciona:
1. Verificar console F12 A errors
2. Verificar se dados não têm caracteres especiais que quebram CSV

### Se styling está errado:
1. Verificar se Tailwind CSS carregou (dist/assets/index*.css)
2. Limpar cache: Ctrl+Shift+Delete

## Ambientes de Teste

| Ambiente | URL | Status |
|----------|-----|--------|
| Local Dev | `http://localhost:5173` | ✅ Ativo |
| Staging | (será preenchido) | ⏳ Futuro |
| Produção | (será preenchido) | ⏳ Futuro |
