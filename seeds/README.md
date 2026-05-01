# 🗄️ Seeds & Backups — Solux ERP

Este diretório contém **backups de dados críticos** que foram comprometidos em algum momento e precisam ser preservados permanentemente no Git.

## 📁 Estrutura

```
seeds/
├── leads/
│   ├── disparador_leads.csv     ← 856 leads de prospecção (backup de 2026-01-23)
│   ├── schema.sql               ← CREATE TABLE da tabela solux_leads
│   └── restore.sh               ← Script para reimportar os dados
└── README.md                    ← Este arquivo
```

## ⚠️ Por que isso existe?

Em **01/05/2026**, o comando `prisma db push --accept-data-loss` foi executado sem dry-run e **apagou permanentemente** as seguintes tabelas do banco Supabase de produção:

- `solux_leads` — **856 leads de prospecção** ← recuperados deste backup
- `linex_categories` — 8 categorias (dados não recuperados)
- `linex_documents` — 17 documentos (dados não recuperados)
- `luvep_materials` — 49 materiais (dados não recuperados)
- `luvep_service_items` — 34 itens de serviço (dados não recuperados)
- `luvep_services` — 8 serviços (dados não recuperados)

## 🔄 Como restaurar os leads

```bash
# Opção 1: via script automático (recomendado)
bash seeds/leads/restore.sh

# Opção 2: via Supabase Dashboard
# → Table Editor → solux_leads → Import CSV → seeds/leads/disparador_leads.csv
```

## 🛡️ Regras de proteção ativas

- **NUNCA** rodar `prisma db push --accept-data-loss` diretamente
- **SEMPRE** usar `bash scripts/db-push-safe.sh` que faz dry-run primeiro
- O `smart_commit.sh` detecta mudanças no schema e exige confirmação
