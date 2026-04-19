const { Pool } = require("pg");

const connectionString = "postgresql://postgres.qngeynazgejtxjszxtxt:G%40laxyyace134679@aws-1-sa-east-1.pooler.supabase.com:6543/postgres";

async function main() {
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
    });

    try {
        console.log("Applying transaction fields...");
        await pool.query(`
            ALTER TABLE "transactions" 
            ADD COLUMN IF NOT EXISTS "cost_amount" DECIMAL(15, 2) DEFAULT 0.00,
            ADD COLUMN IF NOT EXISTS "markup" DECIMAL(10, 2) DEFAULT 1.00;
        `);

        console.log("Applying project service fields...");
        await pool.query(`
            ALTER TABLE "project_services" 
            ADD COLUMN IF NOT EXISTS "mo_type" TEXT DEFAULT 'fixed',
            ADD COLUMN IF NOT EXISTS "mo_custom_value" DECIMAL(15, 2) DEFAULT 0.00;
        `);

        console.log("Applying project reserves...");
        await pool.query(`
            ALTER TABLE "projects" 
            ADD COLUMN IF NOT EXISTS "budget_solux_reserve" DECIMAL(15, 2) DEFAULT 0.00;
        `);

        console.log("Migration performed successfully!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await pool.end();
    }
}
main();
