import { supabase } from './services/supabaseClient';

async function migrateContracts() {
    console.log('🔄 Aplicando migração da tabela contract_rules...');
    
    // Check if we can use exec_sql
    const sql = `
        CREATE TABLE IF NOT EXISTS contract_rules (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            type VARCHAR(50) NOT NULL, -- 'base_rate' or 'tier'
            label VARCHAR(255) NOT NULL,
            min_kg NUMERIC(10, 2) DEFAULT 0,
            price NUMERIC(10, 2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Inserir dados iniciais se a tabela estiver vazia
        INSERT INTO contract_rules (type, label, min_kg, price)
        SELECT 'base_rate', 'Taxa Base (Ato do Pedido)', 0, 15.90
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

    try {
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
            console.error('❌ Erro RPC exec_sql:', error.message);
            console.log('📋 Por favor, crie a tabela manualmente no Supabase.');
        } else {
            console.log('✅ Tabela contract_rules criada com sucesso!');
        }
    } catch (e: any) {
        console.error('❌ Exception:', e.message);
    }
}

migrateContracts();
