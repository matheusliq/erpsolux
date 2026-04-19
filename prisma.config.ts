import "dotenv/config";
import { defineConfig, env } from "@prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        // DIRECT_URL para migrations (prisma migrate / db push)
        // O Session Mode (porta 5432) é necessário para DDL statements
        url: env("DIRECT_URL"),
    },
});