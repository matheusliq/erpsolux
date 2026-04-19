const { Client } = require('pg');

const OLD_DB_URL = "postgresql://postgres:SoluxPinturas123@db.imlzvrzlyegqpsuansrb.supabase.co:5432/postgres";
const NEW_DB_URL = "postgresql://postgres:SoluxPinturas123@db.qngeynazgejtxjszxtxt.supabase.co:5432/postgres";

async function run() {
    const oldDb = new Client({ connectionString: OLD_DB_URL, ssl: { rejectUnauthorized: false }});
    const newDb = new Client({ connectionString: NEW_DB_URL, ssl: { rejectUnauthorized: false }});

    await oldDb.connect();
    await newDb.connect();
    console.log("Conectado em ambos os bancos.");

    const tables = [
        "categories",
        "payment_methods",
        "profiles",
        "users",
        "entities",
        "projects",
        "transactions",
        "audit_logs"
    ];

    for (const table of tables) {
        console.log(`\nMigrando [${table}]...`);
        try {
            const { rows } = await oldDb.query(`SELECT * FROM ${table}`);
            if (rows.length === 0) {
                console.log(`  > 0 registros. Ignorada.`);
                continue;
            }
            console.log(`  > ${rows.length} registros extraídos...`);

            const cols = Object.keys(rows[0]);
            const colNames = cols.map(c => `"${c}"`).join(", ");
            const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
            
            let count = 0;
            // Migrar um por vez
            for (const row of rows) {
                const values = cols.map(c => row[c]);
                try {
                    await newDb.query(`INSERT INTO ${table} (${colNames}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`, values);
                    count++;
                } catch (e) {
                    console.log(`  ! Erro no insert individual de ${table}: ${e.message}`);
                }
            }
            console.log(`  ✅ ${count} salvos.`);
        } catch(e) {
             console.log(`  ❌ Erro lendo ${table}: ${e.message}`);
        }
    }

    await oldDb.end();
    await newDb.end();
    console.log("MIGRAÇÃO TOTAL JS CONCLUÍDA!");
}

run();
