// test-connection.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    try {
        const result = await prisma.categories.findFirst();
        console.log('✅ Conexão OK:', result ? result.name : 'Nenhuma categoria ainda');
    } catch (e) {
        console.error('❌ ERRO:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
