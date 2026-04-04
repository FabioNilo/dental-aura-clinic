#!/bin/bash
# Script para executar migration financeira no Supabase

# Você precisa ter Supabase CLI instalado: npm install -g supabase

# Opção 1: Via CLI (recomendado)
# supabase db push

# Opção 2: Copiar e colar manualmente no Supabase Dashboard
# 1. Vá para: https://supabase.com/dashboard/project/wkikjfqewtmocwdrrcdz/sql/new
# 2. Cole o conteúdo de: supabase/migrations/20260404000002_create_financeiro_tables.sql
# 3. Clique em "Run"

# Opção 3: Usar psql diretamente (substitua PASSWORD e HOST)
# psql -U postgres -h db.wkikjfqewtmocwdrrcdz.supabase.co -d postgres -f supabase/migrations/20260404000002_create_financeiro_tables.sql

echo "Opções de execução da migration:"
echo "1. CLI: supabase db push"
echo "2. Dashboard: https://supabase.com/dashboard/project/wkikjfqewtmocwdrrcdz/sql/new"
echo "3. psql (direto no banco)"
