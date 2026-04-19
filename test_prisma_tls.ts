import { PrismaClient } from "@prisma/client";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log("Variáveis de Ambiente:");
console.log("DATABASE_URL =", process.env.DATABASE_URL);

async function check() {
  try {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    const categories = await prisma.categories.findMany();
    console.log("✅ OK - Categorias encontradas localmente usando Adapter:", categories.length);
    prisma.$disconnect();
    pool.end();
  } catch (e) {
    console.error("❌ ERRO ADAPTER:", e);
  }
}
check();
