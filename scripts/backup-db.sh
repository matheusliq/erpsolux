#!/bin/bash
# ============================================================
# FULL DATABASE BACKUP — Solux ERP / Supabase
# Cria um dump completo do banco e salva em seeds/backups/
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/seeds/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/full_backup_$DATE.sql"

# Carrega variáveis de ambiente
if [ -f "$PROJECT_DIR/.env" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

DIRECT_URL="${DIRECT_URL}"

if [ -z "$DIRECT_URL" ]; then
    echo "❌ DIRECT_URL não encontrada no .env"
    echo "   Certifique-se que o arquivo .env contém DIRECT_URL="
    exit 1
fi

mkdir -p "$BACKUP_DIR"

echo ""
echo "🗄️  Iniciando backup completo do banco Supabase..."
echo "   Conectando em: $(echo $DIRECT_URL | sed 's/:\/\/.*@/:\/\/***@/')"
echo "   Destino: $BACKUP_FILE"
echo ""

pg_dump "$DIRECT_URL" \
    --no-owner \
    --no-acl \
    --schema=public \
    --verbose \
    --file="$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)

echo ""
echo "✅ Backup concluído!"
echo "   Arquivo: $BACKUP_FILE"
echo "   Tamanho: $SIZE"
echo ""
echo "📌 Para versionar no Git:"
echo "   cd $PROJECT_DIR"
echo "   git add seeds/backups/"
echo "   git commit -m 'backup: full db snapshot $DATE'"
echo "   git push"
