-- Migration V2: Adiciona campos de MO customizável por vínculo de serviço
-- Executar no Supabase SQL Editor

ALTER TABLE project_services
  ADD COLUMN IF NOT EXISTS mo_type         TEXT    DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS mo_custom_value NUMERIC(10,2);

-- Garante que o usuário Master existe no banco (evita FK error em transações)
INSERT INTO users (id, name, username, password, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'Master Admin', 'master', 'SISTEMA_NAO_LOGIN', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Garante is_resale, project_service_id, material_id nas transações (já devem existir)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS is_resale          BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS project_service_id UUID    REFERENCES project_services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS material_id        UUID    REFERENCES materials(id)         ON DELETE SET NULL;

-- Adicionando campos de inteligência financeira individual por lançamento
ALTER TABLE "transactions" 
ADD COLUMN IF NOT EXISTS "cost_amount" DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "markup" DECIMAL(10, 2) DEFAULT 1.00;
