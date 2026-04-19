import prisma from './lib/prisma';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qngeynazgejtxjszxtxt.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZ2V5bmF6Z2VqdHhqc3p4dHh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg0MjU4MSwiZXhwIjoyMDg4NDE4NTgxfQ.uV22uZqCruWgiAUw1rHvXm_3n0rrFS_4oAmDiKm2RI0';

// Usa supabase js para consultar as tabelas antigas brutas que não estão no Prisma Solux
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log('🔄 Iniciando migração do núcleo LUVEP para Solux ERP...');

    // 1. Entities (luvep_customers)
    console.log('📦 Extraindo luvep_customers -> entities...');
    const { data: customers } = await supabase.from('luvep_customers').select('*');
    if (customers && customers.length > 0) {
        for (const c of customers) {
            try {
                await prisma.entities.upsert({
                    where: { id: c.id },
                    update: { name: c.name },
                    create: { id: c.id, name: c.name, type: 'Cliente', document: c.document, created_at: c.created_at }
                });
            } catch(e) {}
        }
        console.log(`✅ ${customers.length} Clientes (entities) inseridos.`);
    }

    // 2. Projects (luvep_projects)
    console.log('📦 Extraindo luvep_projects -> projects...');
    const { data: projects } = await supabase.from('luvep_projects').select('*');
    if (projects && projects.length > 0) {
        for (const p of projects) {
            try {
                await prisma.projects.upsert({
                    where: { id: p.id },
                    update: { name: p.name },
                    create: { id: p.id, name: p.name, start_date: p.start_date, status: p.status, client_id: p.customer_id, created_at: p.created_at }
                });
            } catch(e) {}
        }
        console.log(`✅ ${projects.length} Obras (projects) inseridos.`);
    }

    // 3. Transactions (luvep_cash_flow)
    console.log('📦 Extraindo luvep_cash_flow -> transactions...');
    const { data: flow } = await supabase.from('luvep_cash_flow').select('*');
    if (flow && flow.length > 0) {
        let count = 0;
        for (const f of flow) {
            try {
                const typeMap = f.type === 'INCOME' ? 'entrada' : 'saida';
                const statusMap = f.status === 'PAID' ? 'Pago' : 'Agendado';
                
                await prisma.transactions.upsert({
                    where: { id: f.id },
                    update: { name: f.description, amount: f.amount },
                    create: { 
                        id: f.id, 
                        name: f.description, 
                        amount: f.amount, 
                        type: typeMap, 
                        status: statusMap, 
                        due_date: new Date(f.due_date),
                        category_id: null,
                        project_id: f.project_id,
                        entity_id: f.customer_id,
                        payment_method_id: f.payment_method_id,
                        created_at: f.created_at
                    }
                });
                count++;
            } catch(e) {}
        }
        console.log(`✅ ${count} Lançamentos (transactions) inseridos.`);
    }

    console.log('🎉 Migração concluída com sucesso!');
}

main().finally(() => prisma.$disconnect());
