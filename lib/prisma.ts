import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Aceita o certificado self-signed do pooler Supabase sem quebrar o handshake TLS
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * REGRA PERMANENTE — Solux ERP + Supabase:
 *
 * DATABASE_URL → Transaction Pooler (aws-1, porta 6543, pgbouncer=true)
 *   → Usar SEMPRE no runtime (Next.js Server Actions, API Routes, etc.)
 *   → Funciona de qualquer rede: localhost, Vercel, CI
 *
 * DIRECT_URL   → IPv6 direto ao servidor Postgres (porta 5432)
 *   → Usar APENAS em `prisma migrate` / `prisma db push` via CLI
 *   → Instável de redes externas à VPC da Supabase; NÃO usar no runtime
 *
 * @prisma/adapter-pg é obrigatório no Prisma v7 (substitui o engine Rust nativo).
 */
const rawConnectionString = process.env.DATABASE_URL;
if (!rawConnectionString) {
    throw new Error(
        "CRITICAL ERROR: DATABASE_URL environment variable is not defined.\n" +
        "Please ensure it is set in your .env file (local) or Vercel Dashboard (production).\n" +
        "The application cannot connect to the database without this variable."
    );
}

// Remove ?pgbouncer=true se presente: o @prisma/adapter-pg gerencia o pool
// diretamente via pg.Pool e esse parâmetro é exclusivo do engine Rust nativo.
const connectionString = rawConnectionString
    .replace("?pgbouncer=true", "")
    .replace("&pgbouncer=true", "");

if (process.env.NODE_ENV !== "production") {
    console.log("[Prisma] Conectando via pool:", connectionString.split("@")[1]?.split("/")[0] ?? "host desconhecido");
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    // Timeout conservador para detectar falhas rápido e não travar o servidor
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    max: 10,
});

const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => new PrismaClient({ adapter });

declare global {
    // eslint-disable-next-line no-var
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;