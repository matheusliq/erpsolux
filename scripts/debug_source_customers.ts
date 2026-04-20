import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qngeynazgejtxjszxtxt.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZ2V5bmF6Z2VqdHhqc3p4dHh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg0MjU4MSwiZXhwIjoyMDg4NDE4NTgxfQ.uV22uZqCruWgiAUw1rHvXm_3n0rrFS_4oAmDiKm2RI0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log('Fetching customers from source...');
    const { data: customers, error } = await supabase.from('luvep_customers').select('id, name');
    
    if (error) {
        console.error('Error fetching customers:', error);
        return;
    }

    if (!customers || customers.length === 0) {
        console.log('No customers found in luvep_customers table.');
        return;
    }

    console.log(`Found ${customers.length} customers:`);
    customers.forEach(c => console.log(`- ${c.name} (${c.id})`));
}

main();
