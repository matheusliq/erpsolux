import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Luvep Supabase configuration
const LUVEP_SUPABASE_URL = process.env.LUVEP_SUPABASE_URL || 'https://qngeynazgejtxjszxtxt.supabase.co';
const LUVEP_SUPABASE_KEY = process.env.LUVEP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZ2V5bmF6Z2VqdHhqc3p4dHh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg0MjU4MSwiZXhwIjoyMDg4NDE4NTgxfQ.uV22uZqCruWgiAUw1rHvXm_3n0rrFS_4oAmDiKm2RI0';

const luvepSupabase = createClient(LUVEP_SUPABASE_URL, LUVEP_SUPABASE_KEY);

async function main() {
  console.log('🔄 Iniciando migração de dados do Luvep ERP para Solux ERP...');

  // 1. Extrair Materiais
  console.log('📦 Extraindo materiais...');
  const { data: materials, error: materialsError } = await luvepSupabase
    .from('luvep_materials')
    .select('*');
  
  if (materialsError) throw materialsError;

  console.log(`✅ ${materials?.length || 0} materiais encontrados.`);

  // Inserir Materiais
  if (materials && materials.length > 0) {
    console.log('💾 Salvando materiais no Solux ERP...');
    let successCount = 0;
    for (const material of materials) {
      try {
        await prisma.materials.upsert({
          where: { description: material.description },
          update: {
            category: material.category,
            unit: material.unit,
            cost_price: material.cost_price,
            markup_factor: material.markup_factor,
            is_resale: material.is_resale,
            created_at: material.created_at,
            updated_at: material.updated_at
          },
          create: {
            id: material.id,
            sku: material.sku || `MIG-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
            category: material.category,
            description: material.description,
            unit: material.unit,
            cost_price: material.cost_price,
            markup_factor: material.markup_factor,
            is_resale: material.is_resale,
            created_at: material.created_at,
            updated_at: material.updated_at
          }
        });
        successCount++;
      } catch (err) {
        console.error(`Erro ao inserir material ${material.description}:`, err);
      }
    }
    console.log(`✅ ${successCount} materiais salvos com sucesso.`);
  }

  // 2. Extrair Serviços
  console.log('🔧 Extraindo serviços...');
  const { data: services, error: servicesError } = await luvepSupabase
    .from('luvep_services')
    .select('*');

  if (servicesError) throw servicesError;

  console.log(`✅ ${services?.length || 0} serviços encontrados.`);

  // Inserir Serviços
  if (services && services.length > 0) {
    console.log('💾 Salvando serviços no Solux ERP...');
    let successCount = 0;
    for (const service of services) {
      try {
        await prisma.services.upsert({
          where: { code: service.code },
          update: {
            name: service.name,
            executor: service.executor,
            fds: service.fds,
            mo_value: service.mo_value,
            logistics_value: service.logistics_value,
            logistics_sell_value: service.logistics_sell_value,
            mo_sell_value: service.mo_sell_value,
            updated_at: service.updated_at
          },
          create: {
            id: service.id,
            code: service.code,
            name: service.name,
            executor: service.executor,
            fds: service.fds,
            mo_value: service.mo_value,
            logistics_value: service.logistics_value,
            logistics_sell_value: service.logistics_sell_value,
            mo_sell_value: service.mo_sell_value,
            created_at: service.created_at,
            updated_at: service.updated_at
          }
        });
        successCount++;
      } catch (err) {
        console.error(`Erro ao inserir serviço ${service.code}:`, err);
      }
    }
    console.log(`✅ ${successCount} serviços salvos com sucesso.`);
  }

  // 3. Extrair Itens de Serviço (Composições)
  console.log('🧩 Extraindo composições de serviço...');
  const { data: serviceItems, error: itemsError } = await luvepSupabase
    .from('luvep_service_items')
    .select('*');
  
  if (itemsError) throw itemsError;

  console.log(`✅ ${serviceItems?.length || 0} composições encontradas.`);

  if (serviceItems && serviceItems.length > 0) {
    console.log('💾 Salvando composições no Solux ERP...');
    let successCount = 0;
    for (const item of serviceItems) {
      try {
        await prisma.service_items.upsert({
          where: {
            service_id_material_id: {
              service_id: item.service_id,
              material_id: item.material_id
            }
          },
          update: {
            quantity: item.quantity,
          },
          create: {
            id: item.id,
            service_id: item.service_id,
            material_id: item.material_id,
            quantity: item.quantity,
            created_at: item.created_at
          }
        });
        successCount++;
      } catch (err) {
        console.error(`Erro ao inserir composição. Serviço ID: ${item.service_id}. Material ID: ${item.material_id}`, err);
      }
    }
    console.log(`✅ ${successCount} composições salvas com sucesso.`);
  }

  console.log('🎉 Migração concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro na migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
