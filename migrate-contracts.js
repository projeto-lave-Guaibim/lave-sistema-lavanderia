const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uufmwhhkosxmfozsgzaf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1Zm13aGhrb3N4bWZvenNnemFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDQ2NzksImV4cCI6MjA3NjA4MDY3OX0.mC06yvRwvR0PM2ONVHnEbvBOTkbjrSWvraS2BOPTzVk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    console.log('🔄 Executando migração de contract_rules...');
    const sql = `
        CREATE TABLE IF NOT EXISTS contract_rules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            type VARCHAR(50) NOT NULL,
            label VARCHAR(255) NOT NULL,
            min_kg NUMERIC(10, 2) DEFAULT 0,
            price NUMERIC(10, 2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );

        INSERT INTO contract_rules (type, label, min_kg, price)
        SELECT 'base_rate', 'Taxa Base (Base Rate do Contrato)', 0, 15.90
        WHERE NOT EXISTS (SELECT 1 FROM contract_rules WHERE type = 'base_rate');

        INSERT INTO contract_rules (type, label, min_kg, price)
        SELECT 'tier', 'Faixa 1 (até 59 kg)', 0, 15.90
        WHERE NOT EXISTS (SELECT 1 FROM contract_rules WHERE type = 'tier' AND min_kg = 0);

        INSERT INTO contract_rules (type, label, min_kg, price)
        SELECT 'tier', 'Faixa 2 (60–199 kg)', 60, 14.90
        WHERE NOT EXISTS (SELECT 1 FROM contract_rules WHERE type = 'tier' AND min_kg = 60);

        INSERT INTO contract_rules (type, label, min_kg, price)
        SELECT 'tier', 'Faixa 3 (200 kg+)', 200, 13.90
        WHERE NOT EXISTS (SELECT 1 FROM contract_rules WHERE type = 'tier' AND min_kg = 200);
    `;

    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
        console.error('❌ Erro:', error.message);
    } else {
        console.log('✅ Migração concluída com sucesso!');
    }
}

run();
