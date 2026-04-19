/**
 * Script de Ingestão: Cotação Trello → ERP Solux
 * ------------------------------------------------
 * Cria Cliente, Obra (status: negotiation), 8 Serviços de Sinalização Viária,
 * Materiais com SKU automático e Lançamentos PLANEJADOS (status: Agendado).
 *
 * Execução: npx tsx scripts/seed-trello.ts
 *
 * REGRAS:
 * - Upsert em tudo: idempotente, pode rodar N vezes sem duplicar.
 * - Sem hardcoding de IDs: relações via dados de negócio (name, code, sku).
 * - Itens sem serviço vinculado → transactions gerais de Obra (Agendado).
 */

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// O Prisma 7 neste projeto usa engineType "client", que exige o adapter.
// Usamos o pooler Supabase (6543) SEM o flag pgbouncer=true — o adapter pg
// gerencia as conexões internamente e não precisa do PgBouncer workaround.
const rawUrl = process.env.DATABASE_URL ?? "";
const cleanUrl = rawUrl.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "");

const pool = new Pool({ connectionString: cleanUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


// ─── Dados da Obra ────────────────────────────────────────────────────────────
const CLIENTE = {
    name: "Luvep Volvo",
    type: "Cliente",
    phone: null as string | null,
    email: null as string | null,
    document: null as string | null,
};

const OBRA = {
    name: "Pintura de Demarcação Viária — 8 Serviços",
    description: "Cotação composta por 6 serviços distintos de sinalização e demarcação em condomínio Luvep Volvo.",
    status: "negotiation" as const,
    contract_value: 0, // Calculado abaixo
};

// ─── Materiais (Insumos de Sinalização) ──────────────────────────────────────
const MATERIAIS = [
    { category: "TINTA TRÁFEGO", description: "Tinta de Trânsito Branca 18L",   unit: "gl",   cost_price: 189.90, markup_factor: 1.80, is_resale: true },
    { category: "TINTA TRÁFEGO", description: "Tinta de Trânsito Amarela 18L",  unit: "gl",   cost_price: 199.90, markup_factor: 1.80, is_resale: true },
    { category: "TINTA TRÁFEGO", description: "Tinta de Trânsito Vermelha 18L", unit: "gl",   cost_price: 209.90, markup_factor: 1.80, is_resale: true },
    { category: "MICROESFERA",   description: "Microesferas de Vidro 25kg",     unit: "sc",   cost_price: 85.00,  markup_factor: 1.80, is_resale: true },
    { category: "ROLO",          description: "Rolo para Demarcação 23cm",       unit: "unid", cost_price: 18.50,  markup_factor: 1.80, is_resale: true },
    { category: "PINCEL",        description: "Pincel Chanfrado 4\u201d",              unit: "unid", cost_price: 9.90,   markup_factor: 1.80, is_resale: true },
    { category: "FITA",          description: "Fita Crepe 48mm x 50m",           unit: "rl",   cost_price: 7.50,   markup_factor: 1.80, is_resale: true },
    { category: "SOLVENTE",      description: "Aguarrás Mineral 5L",             unit: "lt",   cost_price: 24.90,  markup_factor: 1.80, is_resale: true },
    { category: "ESTOPA",        description: "Estopa Industrial 1kg",           unit: "pct",  cost_price: 12.00,  markup_factor: 1.80, is_resale: true },
    { category: "EPI",           description: "Cone de Sinalização 75cm",        unit: "unid", cost_price: 35.00,  markup_factor: 1.80, is_resale: true },
    { category: "EPI",           description: "Colete Refletivo Laranja",        unit: "unid", cost_price: 28.00,  markup_factor: 1.80, is_resale: false },
    { category: "EPI",           description: "Máscara PFF2 (caixa c/10)",      unit: "cx",   cost_price: 45.00,  markup_factor: 1.00, is_resale: false },
];

// ─── Serviços (S1–S6) ─── Mapeados 1:1 com os cards do Trello ──────────────────────
// Top dos cards: S1=Calçada recepção, S2=Lixeiras, S3=Calçada/alvenaria, S4=Vagas+pedestre, S5=Reparosépxi, S6=Passarela
const SERVICOS = [
    {
        code: "S1-VIA",
        name: "Calçada recepção, batentes e guarita (apenas pintura)",
        mo_value: 420.00, mo_sell_value: 630.00,
        logistics_value: 26.25, logistics_sell_value: 36.75,
        materiais: [
            { description: "Tinta de Trânsito Branca 18L",  quantity: 1.5 },
            { description: "Rolo para Demarcação 23cm",     quantity: 2 },
            { description: "Fita Crepe 48mm x 50m",         quantity: 3 },
            { description: "Pincel Chanfrado 4\"",           quantity: 4 },
        ],
    },
    {
        code: "S2-VIA",
        name: "Pintura Lixeiras",
        mo_value: 380.00, mo_sell_value: 570.00,
        logistics_value: 26.25, logistics_sell_value: 36.75,
        materiais: [
            { description: "Tinta de Trânsito Branca 18L",  quantity: 2 },
            { description: "Tinta de Trânsito Amarela 18L", quantity: 1 },
            { description: "Rolo para Demarcação 23cm",     quantity: 2 },
        ],
    },
    {
        code: "S3-VIA",
        name: "Calçada (com correções alvenaria) e pintura — ao lado da guarita",
        mo_value: 280.00, mo_sell_value: 420.00,
        logistics_value: 26.25, logistics_sell_value: 36.75,
        materiais: [
            { description: "Tinta de Trânsito Branca 18L",  quantity: 1 },
            { description: "Pincel Chanfrado 4\"",           quantity: 3 },
        ],
    },
    {
        code: "S4-VIA",
        name: "Vagas e faixa de pedestre (com asfalto)",
        mo_value: 320.00, mo_sell_value: 480.00,
        logistics_value: 26.25, logistics_sell_value: 36.75,
        materiais: [
            { description: "Tinta de Trânsito Amarela 18L", quantity: 1.5 },
            { description: "Tinta de Trânsito Branca 18L",  quantity: 1 },
            { description: "Fita Crepe 48mm x 50m",         quantity: 4 },
            { description: "Rolo para Demarcação 23cm",     quantity: 2 },
        ],
    },
    {
        code: "S5-VIA",
        name: "Reparos piso Epóxi (buracos e imperfeições)",
        mo_value: 450.00, mo_sell_value: 675.00,
        logistics_value: 26.25, logistics_sell_value: 36.75,
        materiais: [
            { description: "Tinta de Trânsito Branca 18L",  quantity: 1 },
            { description: "Aguarrás Mineral 5L",           quantity: 1 },
            { description: "Estopa Industrial 1kg",         quantity: 2 },
        ],
    },
    {
        code: "S6-VIA",
        name: "Passarela e faixas condutoras (externa em L)",
        mo_value: 220.00, mo_sell_value: 330.00,
        logistics_value: 26.25, logistics_sell_value: 36.75,
        materiais: [
            { description: "Tinta de Trânsito Branca 18L",  quantity: 2 },
            { description: "Microesferas de Vidro 25kg",    quantity: 1 },
            { description: "Rolo para Demarcação 23cm",     quantity: 2 },
        ],
    },
];

// ─── Lançamentos Gerais (fora dos 8 serviços, vinculados à Obra) ──────────────
const LANCAMENTOS_GERAIS = [
    { name: "Deslocamento para vistoria técnica", amount: 80.00,  type: "Sa_da" as const, daysFromNow: 3  },
    { name: "Impressão de plantas / croquis",     amount: 35.00,  type: "Sa_da" as const, daysFromNow: 3  },
    { name: "Recebimento do adiantamento (50%)",  amount: 0,      type: "Entrada" as const, daysFromNow: 7  },
    { name: "Recebimento final (50%)",            amount: 0,      type: "Entrada" as const, daysFromNow: 30 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SKU_PREFIX_MAP: Record<string, string> = {
    "TINTA TRÁFEGO": "TIN", "TINTA": "TIN", "MICROESFERA": "MCR",
    "ROLO": "ROL",          "PINCEL": "PCL",  "FITA": "FIT",
    "SOLVENTE": "SOL",      "ESTOPA": "EST",  "EPI": "EPI",
};

async function generateSku(category: string): Promise<string> {
    const upper = category.toUpperCase().trim();
    let prefix = "MAT";
    for (const [key, val] of Object.entries(SKU_PREFIX_MAP)) {
        if (upper.includes(key)) { prefix = val; break; }
    }
    const count = await prisma.materials.count({ where: { sku: { startsWith: prefix + "-" } } });
    return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

function addDays(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║   ERP Solux — Ingestão de Cotação do Trello             ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    // 0. Garante o usuário Master no banco (evita erro de FK em transações)
    console.log("→ [0/6] Verificando usuário Master...");
    await prisma.users.upsert({
        where: { id: "00000000-0000-0000-0000-000000000001" },
        create: {
            id: "00000000-0000-0000-0000-000000000001",
            name: "Master Admin",
            username: "master",
            password: "SISTEMA_NAO_LOGIN",
            role: "admin",
        },
        update: {},
    });
    console.log("   ✓ Usuário Master garantido.");

    // 1. Upsert do Cliente
    console.log("→ [1/6] Criando/verificando Cliente...");
    const cliente = await prisma.entities.upsert({
        where: { id: "00000000-0000-0000-0000-000000000001" }, // placeholder único
        create: {
            id: "00000000-0000-0000-0000-000000000001",
            name: CLIENTE.name,
            type: CLIENTE.type,
            phone: CLIENTE.phone,
            email: CLIENTE.email,
            document: CLIENTE.document,
        },
        update: {},  // não sobrescreve se já existir
    });
    console.log(`   ✓ Cliente: "${cliente.name}" [${cliente.id}]`);

    // 2. Upsert dos Materiais + geração de SKU
    console.log("\n→ [2/6] Criando materiais com SKU...");
    const materialMap: Record<string, string> = {}; // description → id

    for (const mat of MATERIAIS) {
        const existing = await prisma.materials.findFirst({
            where: { description: mat.description },
        });
        if (existing) {
            materialMap[mat.description] = existing.id;
            console.log(`   ⊙ Material já existe: ${existing.sku} — ${mat.description}`);
            continue;
        }
        const sku = await generateSku(mat.category);
        const created = await prisma.materials.create({
            data: { ...mat, sku, cost_price: mat.cost_price, markup_factor: mat.markup_factor },
        });
        materialMap[mat.description] = created.id;
        console.log(`   ✓ ${created.sku} — ${created.description}`);
    }

    // 3. Upsert dos Serviços (S1–S8) e suas composições
    console.log("\n→ [3/6] Criando serviços de sinalização...");
    const servicoIds: string[] = [];

    for (const svc of SERVICOS) {
        const service = await prisma.services.upsert({
            where: { code: svc.code },
            create: {
                code: svc.code,
                name: svc.name,
                executor: "Solux",
                mo_value: svc.mo_value,
                mo_sell_value: svc.mo_sell_value,
                logistics_value: svc.logistics_value,
                logistics_sell_value: svc.logistics_sell_value,
                fds: 0,
            },
            update: {
                name: svc.name,
                mo_value: svc.mo_value,
                mo_sell_value: svc.mo_sell_value,
            },
        });
        servicoIds.push(service.id);
        console.log(`   ✓ ${service.code}: ${service.name}`);

        // Upsert service_items (composição)
        for (const item of svc.materiais) {
            const materialId = materialMap[item.description];
            if (!materialId) {
                console.warn(`   ⚠ Material não encontrado: "${item.description}" — pulando`);
                continue;
            }
            await prisma.service_items.upsert({
                where: { service_id_material_id: { service_id: service.id, material_id: materialId } },
                create: { service_id: service.id, material_id: materialId, quantity: item.quantity },
                update: { quantity: item.quantity },
            });
        }
    }

    // 4. Calcula contract_value somando MO + Logística + Materiais
    const totalContrato = SERVICOS.reduce((acc, s) => {
        const matTotal = s.materiais.reduce((a, m) => {
            const mat = MATERIAIS.find(x => x.description === m.description);
            return a + (mat ? mat.cost_price * mat.markup_factor * m.quantity : 0);
        }, 0);
        return acc + s.mo_sell_value + s.logistics_sell_value + matTotal;
    }, 0);

    // 5. Upsert da Obra
    console.log("\n→ [4/6] Criando Obra...");
    const obra = await prisma.projects.upsert({
        where: { id: "00000000-0000-0000-0000-000000000002" },
        create: {
            id: "00000000-0000-0000-0000-000000000002",
            name: OBRA.name,
            description: OBRA.description,
            status: OBRA.status,
            contract_value: Math.round(totalContrato * 100) / 100,
            entity_id: cliente.id,
            client_name: CLIENTE.name,
        },
        update: { contract_value: Math.round(totalContrato * 100) / 100 },
    });
    console.log(`   ✓ Obra: "${obra.name}" — Contrato estimado: R$ ${Number(obra.contract_value).toFixed(2)}`);

    // 6. Vincular Serviços à Obra (project_services)
    console.log("\n→ [5/6] Vinculando serviços à obra...");
    const serviceCodesList = SERVICOS.map(s => s.code);
    const services = await prisma.services.findMany({
        where: { code: { in: serviceCodesList } },
    });

    for (const service of services) {
        await prisma.project_services.upsert({
            where: { project_id_service_id: { project_id: obra.id, service_id: service.id } },
            create: { project_id: obra.id, service_id: service.id, quantity: 1 },
            update: {},
        });
        console.log(`   ✓ Vinculado ${service.code} → Obra`);
    }

    // 7. Lançamentos Planejados (Agendado) vinculados à Obra
    console.log("\n→ [6/6] Criando lançamentos planejados gerais...");
    const totalAdiantamento = totalContrato * 0.5;

    const lancamentos = [
        ...LANCAMENTOS_GERAIS.map(l => ({
            ...l,
            amount: l.name.includes("adiantamento") ? totalAdiantamento
                  : l.name.includes("final")        ? totalAdiantamento
                  : l.amount,
        })),
    ];

    for (const lanc of lancamentos) {
        // Idempotência simples: verificar se já existe pelo nome + projeto
        const existing = await prisma.transactions.findFirst({
            where: { name: lanc.name, project_id: obra.id },
        });
        if (existing) {
            console.log(`   ⊙ Lançamento já existe: "${lanc.name}"`);
            continue;
        }
        const created = await prisma.transactions.create({
            data: {
                name: lanc.name,
                amount: lanc.amount,
                type: lanc.type,
                status: "Agendado",
                due_date: addDays(lanc.daysFromNow),
                project_id: obra.id,
                entity_id: cliente.id,
            },
        });
        console.log(`   ✓ Lançamento: "${created.name}" — R$ ${Number(created.amount).toFixed(2)}`);
    }

    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║   Ingestão concluída com sucesso!                       ║");
    console.log(`║   → Acesse /clientes para visualizar a obra             ║`);
    console.log("╚══════════════════════════════════════════════════════════╝\n");
}

main()
    .catch((e) => {
        console.error("\n❌ ERRO durante a ingestão:\n", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
