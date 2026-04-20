import "dotenv/config";
import { defineConfig } from "@prisma/config";

// prisma.config.ts é usado APENAS localmente para migrations (prisma migrate / db push).
// Em produção (Vercel), DIRECT_URL pode não existir — nesse caso usamos DATABASE_URL.
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        // DIRECT_URL usa Session Mode (porta 5432) para DDL statements locais.
        // Fallback para DATABASE_URL em ambientes sem DIRECT_URL (ex: Vercel build).
        url: migrationUrl!,
    },
});