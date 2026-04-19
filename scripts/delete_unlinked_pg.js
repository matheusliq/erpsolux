const { Client } = require('pg');
require('dotenv').config({ path: '/Users/matheus/linex/apps/solux/.env' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  await client.connect();

  const query = `
    DELETE FROM transactions
    WHERE project_service_id IS NULL
    AND project_id IN (
        SELECT id FROM projects WHERE name ILIKE '%Reparos Gerais Luvep%'
    )
    RETURNING id, name, amount;
  `;

  const res = await client.query(query);
  console.log('Deletados:', JSON.stringify(res.rows, null, 2));

  await client.end();
}

main().catch(console.error);
