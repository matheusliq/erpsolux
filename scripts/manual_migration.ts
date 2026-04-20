import pkg from 'pg';
const { Client } = pkg;

const connectionString = "postgresql://postgres.qngeynazgejtxjszxtxt:G%40laxyyace134679@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function main() {
    const client = new Client({ connectionString });
    await client.connect();
    console.log("Connected to database via direct connection.");

    try {
        // 1. Ensure Entity
        console.log("Ensuring Entity 'Luvep Volvo'...");
        await client.query(`
            INSERT INTO entities (id, name, type)
            VALUES ('00000000-0000-0000-0000-000000000001', 'Luvep Volvo', 'Cliente')
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
        `);

        // 2. Ensure Project
        console.log("Ensuring Project 'Reparos Gerais Luvep'...");
        await client.query(`
            INSERT INTO projects (id, name, description, status, contract_value, entity_id, client_name)
            VALUES ('00000000-0000-0000-0000-000000000002', 'Reparos Gerais Luvep', 'Cotação composta por 8 serviços distintos de sinalização e demarcação de trânsito.', 'negotiation', 12840.00, '00000000-0000-0000-0000-000000000001', 'Luvep Volvo')
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, contract_value = EXCLUDED.contract_value;
        `);

        // 3. Create Transactions (Incomes and Expenses)
        console.log("Creating Transactions...");
        const txs = [
            { name: "Recebimento Adiantamento (50%)", amount: 6420.00, type: "Entrada", status: "Pago", days: -2 },
            { name: "Compra de Tintas e Insumos", amount: 2450.00, type: "Saída", status: "Pago", days: -1 },
            { name: "Deslocamento e Logística Inicial", amount: 180.00, type: "Saída", status: "Pago", days: 0 },
            { name: "Recebimento Final (50%)", amount: 6420.00, type: "Entrada", status: "Agendado", days: 15 },
        ];

        for (const tx of txs) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + tx.days);
            
            await client.query(`
                INSERT INTO transactions (name, amount, type, status, due_date, project_id, entity_id)
                VALUES ($1, $2, $3, $4, $5, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001')
                ON CONFLICT DO NOTHING;
            `, [tx.name, tx.amount, tx.type, tx.status, dueDate]);
            console.log(`- Created transaction: ${tx.name}`);
        }

        console.log("Migration check complete. Data should be visible now.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await client.end();
    }
}

main();
