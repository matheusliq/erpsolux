const { Client } = require('pg');

const DB_URL = process.env.DIRECT_URL;

async function run() {
    const db = new Client({ connectionString: "postgresql://postgres.qngeynazgejtxjszxtxt:SoluxPinturas123@aws-0-sa-east-1.pooler.supabase.com:5432/postgres", ssl: { rejectUnauthorized: false }});
    await db.connect();
    
    try {
        const { rows } = await db.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
        console.log("Tabelas no DB:", rows.map(r => r.table_name).join(', '));
        
        for (let table of ['luvep_customers', 'entities', 'luvep_projects', 'projects', 'luvep_cash_flow', 'transactions']) {
            try {
                const res = await db.query(`SELECT count(*) as qtd FROM ${table}`);
                console.log(`- ${table}: ${res.rows[0].qtd} registros`);
            } catch(e) {}
        }
    } catch(e) { console.error(e); }
    await db.end();
}

run();
