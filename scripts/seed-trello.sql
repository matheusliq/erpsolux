-- =====================================================
-- ERP Solux: Seed de Cotação do Trello
-- Pintura de Demarcação Viária — 8 Serviços
-- Execute no SQL Editor do Supabase
-- =====================================================

DO $$
DECLARE
    v_entity_id UUID := '00000000-0000-0000-0000-000000000001';
    v_project_id UUID := '00000000-0000-0000-0000-000000000002';

    -- Material IDs
    m_tinta_branca      UUID;
    m_tinta_amarela     UUID;
    m_tinta_vermelha    UUID;
    m_microesfera       UUID;
    m_rolo              UUID;
    m_pincel            UUID;
    m_fita              UUID;
    m_aguarras          UUID;
    m_estopa            UUID;
    m_cone              UUID;
    m_colete            UUID;
    m_mascara           UUID;

    -- Service IDs
    s1_id UUID; s2_id UUID; s3_id UUID; s4_id UUID;
    s5_id UUID; s6_id UUID; s7_id UUID; s8_id UUID;

    v_total_contrato NUMERIC := 0;
BEGIN

-- ─── 1. CLIENTE ───────────────────────────────────────────────────────────────
INSERT INTO entities (id, name, type)
VALUES (v_entity_id, 'Prefeitura Municipal (Sinalização Viária)', 'Cliente')
ON CONFLICT (id) DO NOTHING;

RAISE NOTICE 'Cliente criado/verificado: %', v_entity_id;

-- ─── 2. MATERIAIS ─────────────────────────────────────────────────────────────
INSERT INTO materials (sku, category, description, unit, cost_price, markup_factor, is_resale)
VALUES ('TIN-00001', 'TINTA TRÁFEGO', 'Tinta de Trânsito Branca 18L',   'gl',   189.90, 1.80, true)
ON CONFLICT (sku) DO NOTHING;
SELECT id INTO m_tinta_branca FROM materials WHERE sku = 'TIN-00001';

INSERT INTO materials (sku, category, description, unit, cost_price, markup_factor, is_resale)
VALUES ('TIN-00002', 'TINTA TRÁFEGO', 'Tinta de Trânsito Amarela 18L',  'gl',   199.90, 1.80, true)
ON CONFLICT (sku) DO NOTHING;
SELECT id INTO m_tinta_amarela FROM materials WHERE sku = 'TIN-00002';

INSERT INTO materials (sku, category, description, unit, cost_price, markup_factor, is_resale)
VALUES ('TIN-00003', 'TINTA TRÁFEGO', 'Tinta de Trânsito Vermelha 18L', 'gl',   209.90, 1.80, true)
ON CONFLICT (sku) DO NOTHING;
SELECT id INTO m_tinta_vermelha FROM materials WHERE sku = 'TIN-00003';

INSERT INTO materials (sku, category, description, unit, cost_price, markup_factor, is_resale)
VALUES ('MCR-00001', 'MICROESFERA', 'Microesferas de Vidro 25kg',        'sc',    85.00, 1.80, true)
ON CONFLICT (sku) DO NOTHING;
SELECT id INTO m_microesfera FROM materials WHERE sku = 'MCR-00001';

INSERT INTO materials (sku, category, description, unit, cost_price, markup_factor, is_resale)
VALUES ('ROL-00001', 'ROLO', 'Rolo para Demarcação 23cm',                'unid',  18.50, 1.80, true)
ON CONFLICT (sku) DO NOTHING;
SELECT id INTO m_rolo FROM materials WHERE sku = 'ROL-00001';

INSERT INTO materials (sku, category, description, unit, cost_price, markup_factor, is_resale)
VALUES ('PCL-00001', 'PINCEL', 'Pincel Chanfrado 4"',                    'unid',   9.90, 1.80, true)
ON CONFLICT (sku) DO NOTHING;
SELECT id INTO m_pincel FROM materials WHERE sku = 'PCL-00001';

INSERT INTO materials (sku, category, description, unit, cost_price, markup_factor, is_resale)
VALUES ('FIT-00001', 'FITA', 'Fita Crepe 48mm x 50m',                   'rl',     7.50, 1.80, true)
ON CONFLICT (sku) DO NOTHING;
SELECT id INTO m_fita FROM materials WHERE sku = 'FIT-00001';

INSERT INTO materials (sku, category, description, unit, cost_price, markup_factor, is_resale)
VALUES ('SOL-00001', 'SOLVENTE', 'Aguarrás Mineral 5L',                  'lt',    24.90, 1.80, true)
ON CONFLICT (sku) DO NOTHING;
SELECT id INTO m_aguarras FROM materials WHERE sku = 'SOL-00001';

INSERT INTO materials (sku, category, description, unit, cost_price, markup_factor, is_resale)
VALUES ('EST-00001', 'ESTOPA', 'Estopa Industrial 1kg',                  'pct',   12.00, 1.80, true)
ON CONFLICT (sku) DO NOTHING;
SELECT id INTO m_estopa FROM materials WHERE sku = 'EST-00001';

INSERT INTO materials (sku, category, description, unit, cost_price, markup_factor, is_resale)
VALUES ('EPI-00001', 'EPI', 'Cone de Sinalização 75cm',                  'unid',  35.00, 1.80, true)
ON CONFLICT (sku) DO NOTHING;
SELECT id INTO m_cone FROM materials WHERE sku = 'EPI-00001';

INSERT INTO materials (sku, category, description, unit, cost_price, markup_factor, is_resale)
VALUES ('EPI-00002', 'EPI', 'Colete Refletivo Laranja',                  'unid',  28.00, 1.00, false)
ON CONFLICT (sku) DO NOTHING;
SELECT id INTO m_colete FROM materials WHERE sku = 'EPI-00002';

INSERT INTO materials (sku, category, description, unit, cost_price, markup_factor, is_resale)
VALUES ('EPI-00003', 'EPI', 'Máscara PFF2 (caixa c/10)',                 'cx',    45.00, 1.00, false)
ON CONFLICT (sku) DO NOTHING;
SELECT id INTO m_mascara FROM materials WHERE sku = 'EPI-00003';

RAISE NOTICE 'Materiais criados/verificados';

-- ─── 3. SERVIÇOS ──────────────────────────────────────────────────────────────
INSERT INTO services (code, name, executor, mo_value, mo_sell_value, logistics_value, logistics_sell_value, fds)
VALUES ('S1-VIA', 'Pintura de Faixas de Pedestres (Zebrinha)', 'Solux', 420.00, 630.00, 26.25, 36.75, 0)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
SELECT id INTO s1_id FROM services WHERE code = 'S1-VIA';

INSERT INTO services (code, name, executor, mo_value, mo_sell_value, logistics_value, logistics_sell_value, fds)
VALUES ('S2-VIA', 'Pintura de Faixas de Solo Geral', 'Solux', 380.00, 570.00, 26.25, 36.75, 0)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
SELECT id INTO s2_id FROM services WHERE code = 'S2-VIA';

INSERT INTO services (code, name, executor, mo_value, mo_sell_value, logistics_value, logistics_sell_value, fds)
VALUES ('S3-VIA', 'Pintura de Meio-Fio', 'Solux', 280.00, 420.00, 26.25, 36.75, 0)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
SELECT id INTO s3_id FROM services WHERE code = 'S3-VIA';

INSERT INTO services (code, name, executor, mo_value, mo_sell_value, logistics_value, logistics_sell_value, fds)
VALUES ('S4-VIA', 'Marcação de Vagas de Estacionamento', 'Solux', 320.00, 480.00, 26.25, 36.75, 0)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
SELECT id INTO s4_id FROM services WHERE code = 'S4-VIA';

INSERT INTO services (code, name, executor, mo_value, mo_sell_value, logistics_value, logistics_sell_value, fds)
VALUES ('S5-VIA', 'Símbolos de Solo (Setas, Cadeirante, Parada)', 'Solux', 450.00, 675.00, 26.25, 36.75, 0)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
SELECT id INTO s5_id FROM services WHERE code = 'S5-VIA';

INSERT INTO services (code, name, executor, mo_value, mo_sell_value, logistics_value, logistics_sell_value, fds)
VALUES ('S6-VIA', 'Aplicação de Microesferas Retroreflexivas', 'Solux', 220.00, 330.00, 26.25, 36.75, 0)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
SELECT id INTO s6_id FROM services WHERE code = 'S6-VIA';

INSERT INTO services (code, name, executor, mo_value, mo_sell_value, logistics_value, logistics_sell_value, fds)
VALUES ('S7-VIA', 'Pintura de Bordas e Limites de Pista', 'Solux', 300.00, 450.00, 26.25, 36.75, 0)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
SELECT id INTO s7_id FROM services WHERE code = 'S7-VIA';

INSERT INTO services (code, name, executor, mo_value, mo_sell_value, logistics_value, logistics_sell_value, fds)
VALUES ('S8-VIA', 'Limpeza e Preparação de Superfície', 'Solux', 260.00, 390.00, 26.25, 36.75, 0)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
SELECT id INTO s8_id FROM services WHERE code = 'S8-VIA';

RAISE NOTICE 'Serviços S1–S8 criados/verificados';

-- ─── 4. COMPOSIÇÃO DOS SERVIÇOS (service_items) ───────────────────────────────
-- S1: Zebrinha
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s1_id, m_tinta_branca, 1.5) ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s1_id, m_rolo, 2)          ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s1_id, m_fita, 3)          ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- S2: Faixas Solo
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s2_id, m_tinta_branca, 2)  ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s2_id, m_tinta_amarela, 1) ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s2_id, m_rolo, 2)          ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- S3: Meio-Fio
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s3_id, m_tinta_branca, 1)   ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s3_id, m_tinta_vermelha, 1) ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s3_id, m_pincel, 3)         ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- S4: Vagas
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s4_id, m_tinta_amarela, 1.5) ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s4_id, m_fita, 4)            ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s4_id, m_rolo, 2)            ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- S5: Símbolos
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s5_id, m_tinta_branca, 1)   ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s5_id, m_tinta_amarela, 0.5) ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s5_id, m_pincel, 4)         ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- S6: Microesferas
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s6_id, m_microesfera, 2) ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- S7: Bordas
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s7_id, m_tinta_branca, 1.5)  ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s7_id, m_tinta_amarela, 0.5) ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s7_id, m_rolo, 2)            ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- S8: Limpeza
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s8_id, m_aguarras, 2) ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;
INSERT INTO service_items (service_id, material_id, quantity) VALUES (s8_id, m_estopa, 3)   ON CONFLICT (service_id, material_id) DO UPDATE SET quantity = EXCLUDED.quantity;

RAISE NOTICE 'Composições (service_items) criadas';

-- ─── 5. OBRA ──────────────────────────────────────────────────────────────────
INSERT INTO projects (id, name, description, status, contract_value, entity_id, client_name)
VALUES (
    v_project_id,
    'Pintura de Demarcação Viária — 8 Serviços',
    'Cotação composta por 8 serviços distintos de sinalização e demarcação de trânsito. Originada do Trello.',
    'negotiation',
    12840.00, -- Estimativa inicial: soma MO venda + logística + materiais markup
    v_entity_id,
    'Prefeitura Municipal (Sinalização Viária)'
)
ON CONFLICT (id) DO UPDATE SET contract_value = EXCLUDED.contract_value;

RAISE NOTICE 'Obra criada/verificada: %', v_project_id;

-- ─── 6. VINCULAR SERVIÇOS À OBRA ─────────────────────────────────────────────
INSERT INTO project_services (project_id, service_id, quantity) VALUES (v_project_id, s1_id, 1) ON CONFLICT (project_id, service_id) DO NOTHING;
INSERT INTO project_services (project_id, service_id, quantity) VALUES (v_project_id, s2_id, 1) ON CONFLICT (project_id, service_id) DO NOTHING;
INSERT INTO project_services (project_id, service_id, quantity) VALUES (v_project_id, s3_id, 1) ON CONFLICT (project_id, service_id) DO NOTHING;
INSERT INTO project_services (project_id, service_id, quantity) VALUES (v_project_id, s4_id, 1) ON CONFLICT (project_id, service_id) DO NOTHING;
INSERT INTO project_services (project_id, service_id, quantity) VALUES (v_project_id, s5_id, 1) ON CONFLICT (project_id, service_id) DO NOTHING;
INSERT INTO project_services (project_id, service_id, quantity) VALUES (v_project_id, s6_id, 1) ON CONFLICT (project_id, service_id) DO NOTHING;
INSERT INTO project_services (project_id, service_id, quantity) VALUES (v_project_id, s7_id, 1) ON CONFLICT (project_id, service_id) DO NOTHING;
INSERT INTO project_services (project_id, service_id, quantity) VALUES (v_project_id, s8_id, 1) ON CONFLICT (project_id, service_id) DO NOTHING;

RAISE NOTICE 'S1–S8 vinculados à Obra';

-- ─── 7. LANÇAMENTOS GERAIS PLANEJADOS (Agendado) ─────────────────────────────
-- Itens fora dos 8 serviços → lançamentos gerais vinculados à obra
INSERT INTO transactions (name, amount, type, status, due_date, project_id, entity_id)
SELECT 'Deslocamento para vistoria técnica', 80.00, 'Saída'::"transaction_type", 'Agendado'::"transaction_status",
       NOW() + INTERVAL '3 days', v_project_id, v_entity_id
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE name = 'Deslocamento para vistoria técnica' AND project_id = v_project_id);

INSERT INTO transactions (name, amount, type, status, due_date, project_id, entity_id)
SELECT 'Impressão de plantas e croquis', 35.00, 'Saída'::"transaction_type", 'Agendado'::"transaction_status",
       NOW() + INTERVAL '3 days', v_project_id, v_entity_id
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE name = 'Impressão de plantas e croquis' AND project_id = v_project_id);

INSERT INTO transactions (name, amount, type, status, due_date, project_id, entity_id)
SELECT 'Recebimento do adiantamento — 50%', 6420.00, 'Entrada'::"transaction_type", 'Agendado'::"transaction_status",
       NOW() + INTERVAL '7 days', v_project_id, v_entity_id
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE name = 'Recebimento do adiantamento — 50%' AND project_id = v_project_id);

INSERT INTO transactions (name, amount, type, status, due_date, project_id, entity_id)
SELECT 'Recebimento final — 50%', 6420.00, 'Entrada'::"transaction_type", 'Agendado'::"transaction_status",
       NOW() + INTERVAL '30 days', v_project_id, v_entity_id
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE name = 'Recebimento final — 50%' AND project_id = v_project_id);

RAISE NOTICE 'Lançamentos planejados criados';

RAISE NOTICE '✓ Ingestão completa! Obra: % | Cliente: %', v_project_id, v_entity_id;

END $$;

-- Verificação final
SELECT
    'Materiais' AS tabela, COUNT(*) AS total FROM materials WHERE sku LIKE 'TIN-%' OR sku LIKE 'MCR-%' OR sku LIKE 'ROL-%'
UNION ALL
SELECT 'Serviços via', COUNT(*) FROM services WHERE code LIKE '%-VIA'
UNION ALL
SELECT 'Obra', COUNT(*) FROM projects WHERE id = '00000000-0000-0000-0000-000000000002'
UNION ALL
SELECT 'Vínculos Obra-Serviço', COUNT(*) FROM project_services WHERE project_id = '00000000-0000-0000-0000-000000000002'
UNION ALL
SELECT 'Lançamentos Planejados', COUNT(*) FROM transactions WHERE project_id = '00000000-0000-0000-0000-000000000002';
