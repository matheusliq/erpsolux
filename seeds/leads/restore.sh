#!/bin/bash
# ============================================================
# RESTORE LEADS — Solux ERP
# Recria a tabela solux_leads e reimporta os 856 leads
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Carrega variáveis de ambiente
if [ -f "$PROJECT_DIR/.env" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

if [ -z "$DIRECT_URL" ]; then
    echo "❌ DIRECT_URL ou DATABASE_URL não encontrada no .env"
    exit 1
fi

echo ""
echo "🔄 Restaurando tabela solux_leads..."
echo ""

# Passo 1: Criar a tabela (se não existir)
echo "📐 [1/2] Criando schema da tabela..."
psql "$DIRECT_URL" -f "$SCRIPT_DIR/schema.sql"
echo "✅ Schema criado."

# Passo 2: Importar CSV
echo ""
echo "📥 [2/2] Importando 856 leads do CSV..."
psql "$DIRECT_URL" -c "\COPY solux_leads(id,created_at,updated_at,nome_estabelecimento,nicho,endereco,bairro,cidade,localizacao,site,contato_nome,numero_contato,numero_decisor,nome_decisor,is_mesmo_contato_decisor,status,follow_up,agente_ia_ativo,humor,resumo_conversa,mensagem_enviada,bloqueado,motivo_bloqueio,data_primeiro_contato,data_ultima_interacao,etapa_funil,remote_jid,whatsapp_message_id) FROM '$SCRIPT_DIR/disparador_leads.csv' CSV HEADER ON CONFLICT (id) DO NOTHING;"

echo ""
echo "✅ Leads restaurados com sucesso!"
echo ""

# Verificação
COUNT=$(psql "$DIRECT_URL" -t -c "SELECT COUNT(*) FROM solux_leads;" | tr -d ' ')
echo "📊 Total de leads na tabela: $COUNT"
