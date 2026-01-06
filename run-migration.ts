import { supabase } from './services/supabaseClient';

async function runMigration() {
    console.log('🔄 Aplicando migração do banco de dados...');
    
    try {
        // Add fee and net_value columns to orders table
        const { error } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE orders 
                ADD COLUMN IF NOT EXISTS fee NUMERIC(10, 2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS net_value NUMERIC(10, 2) DEFAULT 0;
            `
        });

        if (error) {
            console.error('❌ Erro ao aplicar migração:', error.message);
            console.log('\n📋 Por favor, execute manualmente no Supabase SQL Editor:');
            console.log(`
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS fee NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_value NUMERIC(10, 2) DEFAULT 0;
            `);
            process.exit(1);
        }

        console.log('✅ Migração aplicada com sucesso!');
        console.log('✅ Colunas fee e net_value adicionadas à tabela orders');
        
        // Verify columns exist
        const { data: columns, error: verifyError } = await supabase
            .from('orders')
            .select('fee, net_value')
            .limit(1);

        if (verifyError) {
            console.log('⚠️  Aviso: Não foi possível verificar as colunas');
        } else {
            console.log('✅ Verificação concluída - colunas existem no banco');
        }

    } catch (err: any) {
        console.error('❌ Erro inesperado:', err.message);
        console.log('\n📋 Execute manualmente no Supabase SQL Editor (https://supabase.com/dashboard):');
        console.log(`
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS fee NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_value NUMERIC(10, 2) DEFAULT 0;
        `);
        process.exit(1);
    }
}

runMigration();
