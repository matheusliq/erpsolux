const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Aplicando migration 1...");
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "transactions" 
            ADD COLUMN IF NOT EXISTS "cost_amount" DECIMAL(15, 2) DEFAULT 0.00,
            ADD COLUMN IF NOT EXISTS "markup" DECIMAL(10, 2) DEFAULT 1.00;
        `);

        console.log("Aplicando migration 2...");
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "project_services" 
            ADD COLUMN IF NOT EXISTS "mo_type" TEXT DEFAULT 'fixed',
            ADD COLUMN IF NOT EXISTS "mo_custom_value" DECIMAL(15, 2) DEFAULT 0.00;
        `);

        console.log("Aplicando migration 3...");
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "projects" 
            ADD COLUMN IF NOT EXISTS "budget_solux_reserve" DECIMAL(15, 2) DEFAULT 0.00;
        `);

        console.log("Migração concluída com sucesso!");
    } catch (e) {
        console.error("Erro ao aplicar migração:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
