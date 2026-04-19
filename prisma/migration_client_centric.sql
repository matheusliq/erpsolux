-- =====================================================
-- ERP Solux: Migração de Schema - Módulo Client-Centric
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Adicionar entity_id em projects (FK para entities = cliente da obra)
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES entities(id) ON DELETE SET NULL;

-- 2. Adicionar SKU em materials (código único de produto)
ALTER TABLE materials
    ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;

-- Preencher SKUs para registros existentes (baseado em categoria)
-- PADRÃO PostgreSQL: window functions não são permitidas diretamente em UPDATE.
-- Solução: usar CTE para calcular os valores primeiro, depois UPDATE via join.
WITH ranked AS (
    SELECT
        id,
        CONCAT(
            CASE
                WHEN UPPER(category) LIKE '%TINTA%' THEN 'TIN'
                WHEN UPPER(category) LIKE '%ESMALTE%' THEN 'ESM'
                WHEN UPPER(category) LIKE '%ARGAMASSA%' THEN 'ARG'
                WHEN UPPER(category) LIKE '%CIMENTO%' THEN 'CIM'
                WHEN UPPER(category) LIKE '%LIXA%' THEN 'LIX'
                WHEN UPPER(category) LIKE '%FITA%' THEN 'FIT'
                WHEN UPPER(category) LIKE '%PINCEL%' THEN 'PCL'
                WHEN UPPER(category) LIKE '%ROLO%' THEN 'ROL'
                WHEN UPPER(category) LIKE '%ESTOPA%' OR UPPER(category) LIKE '%TRAPO%' THEN 'EST'
                ELSE 'MAT'
            END,
            '-',
            LPAD(CAST(ROW_NUMBER() OVER (ORDER BY created_at) AS TEXT), 5, '0')
        ) AS generated_sku
    FROM materials
    WHERE sku IS NULL
)
UPDATE materials
SET sku = ranked.generated_sku
FROM ranked
WHERE materials.id = ranked.id;


-- Tornar SKU NOT NULL após preenchimento
ALTER TABLE materials
    ALTER COLUMN sku SET NOT NULL;

-- 3. Adicionar campos de margem de segurança em project_services
ALTER TABLE project_services
    ADD COLUMN IF NOT EXISTS safety_margin_type TEXT CHECK (safety_margin_type IN ('percentage', 'fixed')),
    ADD COLUMN IF NOT EXISTS safety_margin_value DECIMAL(10,2) DEFAULT 0.00;

-- 4. Índices de performance
CREATE INDEX IF NOT EXISTS idx_projects_entity_id ON projects(entity_id);
CREATE INDEX IF NOT EXISTS idx_materials_sku ON materials(sku);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_project_services_project_id ON project_services(project_id);

-- Verificação
SELECT 'entity_id em projects' as campo, COUNT(*) as total FROM projects WHERE entity_id IS NOT NULL
UNION ALL
SELECT 'sku em materials', COUNT(*) FROM materials WHERE sku IS NOT NULL
UNION ALL
SELECT 'safety_margin em project_services', COUNT(*) FROM project_services WHERE safety_margin_type IS NOT NULL;
