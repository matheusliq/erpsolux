-- ============================================================
-- Migration Manual: Adicionar campos granulares em transactions
-- Aplicar via Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Adiciona campos de granularidade financeira
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS project_service_id UUID REFERENCES project_services(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS material_id         UUID REFERENCES materials(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS is_resale           BOOLEAN DEFAULT false;

-- 2. Upsert do usuário Master (necessário para evitar erro de FK em transações)
INSERT INTO users (id, name, username, password, role, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Master Admin',
    'master',
    'SISTEMA_NAO_LOGIN',
    'admin',
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 3. Criar índices para queries performáticas
CREATE INDEX IF NOT EXISTS idx_transactions_project_service_id ON transactions(project_service_id);
CREATE INDEX IF NOT EXISTS idx_transactions_material_id        ON transactions(material_id);
CREATE INDEX IF NOT EXISTS idx_transactions_is_resale          ON transactions(is_resale);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id         ON transactions(project_id);
