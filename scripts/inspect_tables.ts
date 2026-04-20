import { Client } from 'pg';

const connectionString = "postgresql://postgres.qngeynazgejtxjszxtxt:G%40laxyyace134679@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function main() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB.');

        const tablesRes = await client.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
        `);

        console.log('All tables in database:');
        tablesRes.rows.forEach(r => console.log(`- ${r.table_schema}.${r.table_name}`));

        if (tablesRes.rows.length === 0) {
            console.log('No tables with luvep_ prefix found.');
        } else {
            for (const row of tablesRes.rows) {
                const countRes = await client.query(`SELECT count(*) FROM "${row.table_name}"`);
                console.log(`- ${row.table_name}: ${countRes.rows[0].count} rows`);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
