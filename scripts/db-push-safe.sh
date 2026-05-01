#!/bin/bash
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  SAFE DB PUSH — Solux ERP                                            ║
# ║  Mostra o que vai mudar ANTES de executar. Bloqueia se houver DROP.  ║
# ╚═══════════════════════════════════════════════════════════════════════╝

set -e
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo ""
echo "🔍 Analisando mudanças no schema Prisma..."
echo ""

# Captura o output do dry-run
DRY_RUN=$(npx prisma db push --accept-data-loss --dry-run 2>&1 || true)

echo "$DRY_RUN"
echo ""

# Detecta operações destrutivas
if echo "$DRY_RUN" | grep -qi "drop\|You are about to"; then
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║  ⛔ OPERAÇÕES DESTRUTIVAS DETECTADAS!                               ║"
    echo "║                                                                      ║"
    echo "║  O comando acima VAI APAGAR tabelas ou colunas com dados reais.     ║"
    echo "║  Isso é IRREVERSÍVEL no plano gratuito do Supabase.                 ║"
    echo "║                                                                      ║"
    echo "║  ANTES de prosseguir, faça um backup manual:                        ║"
    echo "║  → Supabase Dashboard > Database > Backups > Manual backup          ║"
    echo "║  → OU exporte as tabelas como CSV pelo Supabase Table Editor        ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo ""
    read -p "Você leu os avisos e quer PROSSEGUIR mesmo assim? [s/N] " CONFIRM
    if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
        echo ""
        echo "❌ Operação cancelada. Nenhum dado foi alterado."
        exit 1
    fi
    echo ""
    echo "⚠️  Executando db push com operações destrutivas..."
else
    echo "✅ Nenhuma operação destrutiva detectada. Aplicando mudanças..."
fi

npx prisma db push --accept-data-loss

echo ""
echo "✅ Banco de dados sincronizado com sucesso!"
