const { Client } = require('pg');
require('dotenv').config({ path: '/Users/matheus/linex/apps/solux/.env' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  await client.connect();

  const query = `
    SELECT 
      t.name as transacao, 
      t.type as tipo, 
      t.amount as receita, 
      t.cost_amount as custo_real, 
      t.status, 
      s.name as servico
    FROM transactions t
    JOIN projects p ON t.project_id = p.id
    LEFT JOIN project_services ps ON t.project_service_id = ps.id
    LEFT JOIN services s ON ps.service_id = s.id
    WHERE p.name ILIKE '%Reparos Gerais Luvep%'
    ORDER BY t.created_at ASC;
  `;

  const res = await client.query(query);
  console.log('Resultados:', JSON.stringify(res.rows, null, 2));

  await client.end();
}

main().catch(console.error);
