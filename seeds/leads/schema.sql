-- ============================================================
-- SCHEMA: solux_leads
-- Backup criado em: 2026-05-01
-- Motivo: tabela deletada acidentalmente por prisma db push
-- ============================================================

CREATE TABLE IF NOT EXISTS solux_leads (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at               TIMESTAMPTZ DEFAULT NOW(),
    updated_at               TIMESTAMPTZ DEFAULT NOW(),
    nome_estabelecimento     TEXT,
    nicho                    TEXT,
    endereco                 TEXT,
    bairro                   TEXT,
    cidade                   TEXT,
    localizacao              TEXT,
    site                     TEXT,
    contato_nome             TEXT,
    numero_contato           TEXT,
    numero_decisor           TEXT,
    nome_decisor             TEXT,
    is_mesmo_contato_decisor BOOLEAN DEFAULT FALSE,
    status                   TEXT DEFAULT 'novo',
    follow_up                BOOLEAN DEFAULT FALSE,
    agente_ia_ativo          BOOLEAN DEFAULT TRUE,
    humor                    TEXT DEFAULT 'neutro',
    resumo_conversa          TEXT,
    mensagem_enviada         TEXT,
    bloqueado                BOOLEAN DEFAULT FALSE,
    motivo_bloqueio          TEXT,
    data_primeiro_contato    TIMESTAMPTZ,
    data_ultima_interacao    TIMESTAMPTZ,
    etapa_funil              TEXT DEFAULT '0_base_fria',
    remote_jid               TEXT,
    whatsapp_message_id      TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_solux_leads_status ON solux_leads(status);
CREATE INDEX IF NOT EXISTS idx_solux_leads_cidade ON solux_leads(cidade);
CREATE INDEX IF NOT EXISTS idx_solux_leads_remote_jid ON solux_leads(remote_jid);
CREATE INDEX IF NOT EXISTS idx_solux_leads_etapa_funil ON solux_leads(etapa_funil);
