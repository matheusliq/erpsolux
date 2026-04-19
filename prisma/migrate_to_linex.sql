-- =============================================================
-- MIGRAÇÃO COMPLETA: luvep_* → Solux Schema (Linex Supabase)
-- Rodar no SQL Editor: https://app.supabase.com/project/qngeynazgejtxjszxtxt/sql
-- =============================================================

-- ---------------------------------------------------------------
-- 1. CRIAR ENUMS (se não existirem)
-- ---------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('negotiation', 'active', 'completed', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('Atrasado', 'Pago', 'Cancelado', 'Agendado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('Entrada', 'Saída');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------
-- 2. CRIAR TABELAS SOLUX (se não existirem)
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  type           transaction_type NOT NULL,
  color          TEXT DEFAULT '#cbd5e1',
  monthly_budget NUMERIC(15,2),
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entities (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  type       TEXT,
  document   TEXT,
  phone      TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  username   TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  role       TEXT DEFAULT 'partner',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  email        TEXT,
  phone_number TEXT,
  role         TEXT DEFAULT 'staff',
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  description          TEXT,
  client_name          TEXT,
  entity_id            UUID,
  status               project_status DEFAULT 'negotiation',
  start_date           DATE,
  deadline             DATE,
  contract_value       NUMERIC(15,2) DEFAULT 0.00,
  budget_solux_reserve NUMERIC(15,2) DEFAULT 0.00,
  partners_split       JSONB,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  amount            NUMERIC(15,2) NOT NULL,
  type              transaction_type NOT NULL,
  status            transaction_status DEFAULT 'Atrasado',
  due_date          DATE NOT NULL,
  payment_date      DATE,
  category_id       UUID,
  project_id        UUID,
  entity_id         UUID,
  payment_method_id UUID,
  receipt_url       TEXT,
  notes             TEXT,
  created_by        UUID,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  user_id     UUID,
  details     JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS materials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku           TEXT UNIQUE,
  category      TEXT NOT NULL,
  description   TEXT UNIQUE NOT NULL,
  unit          TEXT NOT NULL,
  cost_price    NUMERIC(10,2) DEFAULT 0.00,
  markup_factor NUMERIC(4,2) DEFAULT 1.40,
  is_resale     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                 TEXT UNIQUE NOT NULL,
  name                 TEXT NOT NULL,
  executor             TEXT DEFAULT 'Solux',
  fds                  INT DEFAULT 0,
  mo_value             NUMERIC(10,2) DEFAULT 0.00,
  logistics_value      NUMERIC(10,2) DEFAULT 26.25,
  logistics_sell_value NUMERIC(10,2) DEFAULT 36.75,
  mo_sell_value        NUMERIC(10,2) DEFAULT 0.00,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  quantity    NUMERIC(10,2) DEFAULT 1.00,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_id, material_id)
);

CREATE TABLE IF NOT EXISTS project_services (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  service_id          UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  quantity            NUMERIC(10,2) DEFAULT 1.00,
  safety_margin_type  TEXT,
  safety_margin_value NUMERIC(10,2) DEFAULT 0.00,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, service_id)
);

-- ---------------------------------------------------------------
-- 3. MIGRAR materials: luvep_materials → materials
-- ---------------------------------------------------------------
INSERT INTO materials (id, sku, category, description, unit, cost_price, markup_factor, is_resale, created_at)
SELECT
  gen_random_uuid(),
  CONCAT('LVP-', LPAD(ROW_NUMBER() OVER (ORDER BY lm.created_at)::TEXT, 5, '0')),
  lm.category,
  lm.description,
  lm.unit,
  lm.cost_price,
  COALESCE(lm.markup_factor, 1.40),
  COALESCE(lm.is_resale, true),
  lm.created_at
FROM luvep_materials lm
ON CONFLICT (description) DO UPDATE SET
  cost_price    = EXCLUDED.cost_price,
  markup_factor = EXCLUDED.markup_factor,
  is_resale     = EXCLUDED.is_resale,
  updated_at    = now();

-- ---------------------------------------------------------------
-- 4. MIGRAR services: luvep_services → services
-- ---------------------------------------------------------------
INSERT INTO services (id, code, name, executor, fds, mo_value, logistics_value, logistics_sell_value, mo_sell_value, created_at)
SELECT
  gen_random_uuid(),
  ls.code,
  ls.name,
  COALESCE(ls.executor, 'Solux'),
  COALESCE(ls.fds, 0),
  COALESCE(ls.mo_value, 0.00),
  COALESCE(ls.logistics_value, 26.25),
  COALESCE(ls.logistics_sell_value, 36.75),
  COALESCE(ls.mo_sell_value, 0.00),
  ls.created_at
FROM luvep_services ls
ON CONFLICT (code) DO UPDATE SET
  name                 = EXCLUDED.name,
  mo_value             = EXCLUDED.mo_value,
  logistics_value      = EXCLUDED.logistics_value,
  logistics_sell_value = EXCLUDED.logistics_sell_value,
  mo_sell_value        = EXCLUDED.mo_sell_value,
  updated_at           = now();

-- ---------------------------------------------------------------
-- 5. MIGRAR service_items: luvep_service_items → service_items
-- ---------------------------------------------------------------
INSERT INTO service_items (service_id, material_id, quantity, created_at)
SELECT
  s.id AS service_id,
  m.id AS material_id,
  lsi.quantity,
  lsi.created_at
FROM luvep_service_items lsi
JOIN luvep_services ls ON ls.id = lsi.service_id
JOIN luvep_materials lm ON lm.id = lsi.material_id
JOIN services s ON s.code = ls.code
JOIN materials m ON m.description = lm.description
ON CONFLICT (service_id, material_id) DO UPDATE SET
  quantity = EXCLUDED.quantity;

-- ---------------------------------------------------------------
-- 6. VERIFICAR RESULTADO
-- ---------------------------------------------------------------
SELECT 
  (SELECT COUNT(*) FROM materials)     AS total_materiais,
  (SELECT COUNT(*) FROM services)      AS total_servicos,
  (SELECT COUNT(*) FROM service_items) AS total_itens_servico;
