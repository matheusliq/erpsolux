require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:G%40laxyyace134679@db.qngeynazgejtxjszxtxt.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fix() {
  const entity = await prisma.entities.findFirst({
    where: { name: { contains: 'PREFEITURA', mode: 'insensitive' } }
  });
  if (entity) {
    await prisma.entities.update({
      where: { id: entity.id },
      data: { name: 'LUVEP VOLVO' }
    });
    console.log('✅ Cliente atualizado para LUVEP VOLVO!');
  } else {
    // Acha a Luvep antiga se o nome dela for luvep..
    const luvep = await prisma.entities.findFirst({
      where: { name: { contains: 'LUVEP', mode: 'insensitive' } }
    });
    if (luvep) {
        await prisma.entities.update({
            where: { id: luvep.id },
            data: { name: 'LUVEP VOLVO' }
        });
        console.log('✅ Cliente LUVEP existente atualizado para LUVEP VOLVO!');
    } else {
        console.log('Nenhum cliente Prefeitura ou Luvep achado.');
    }
  }
  await prisma.$disconnect();
  await pool.end();
}

fix();
