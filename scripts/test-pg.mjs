// test-pg3.mjs
import { Pool } from 'pg';

const pool = new Pool({
    host: 'aws-1-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.imlzvrzlyegqpsuansrb',
    password: 'SoluxPinturas123',
    ssl: { rejectUnauthorized: false },
});

try {
    const { rows } = await pool.query('SELECT current_user, version()');
    console.log('✅ CONECTOU:', rows[0]);
} catch (e) {
    console.error('❌ FALHOU:', e.message, 'Código:', e.code);
} finally {
    await pool.end();
}
