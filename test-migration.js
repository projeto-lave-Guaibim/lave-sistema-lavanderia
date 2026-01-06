const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testMigration() {
    console.log('🧪 Testando migração do banco de dados...\n');
    
    try {
        // Test: Check if columns exist by querying
        console.log('1️⃣ Verificando se as colunas existem...');
        const { data: testData, error: testError } = await supabase
            .from('orders')
            .select('id, fee, net_value, value, payment_method')
            .limit(1);

        if (testError) {
            console.error('❌ Erro:', testError.message);
            console.log('\n⚠️  Possíveis causas:');
            console.log('   - As colunas ainda não foram criadas');
            console.log('   - Erro de permissão no Supabase\n');
            process.exit(1);
        }

        console.log('✅ Colunas fee e net_value existem!\n');

        // Check existing orders with payment
        console.log('2️⃣ Verificando pedidos com pagamento...');
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, value, fee, net_value, payment_method')
            .not('payment_method', 'is', null)
            .order('created_at', { ascending: false })
            .limit(5);

        if (ordersError) {
            console.error('❌ Erro ao buscar pedidos:', ordersError.message);
            process.exit(1);
        }

        if (!orders || orders.length === 0) {
            console.log('ℹ️  Nenhum pedido com pagamento encontrado.');
            console.log('   Confirme um pagamento para testar!\n');
        } else {
            console.log(`✅ Encontrados ${orders.length} pedidos:\n`);
            orders.forEach((order) => {
                const hasData = order.fee > 0 || order.net_value > 0;
                console.log(`   Pedido #${order.id}:`);
                console.log(`   - Valor: R$ ${(order.value || 0).toFixed(2)}`);
                console.log(`   - Taxa: R$ ${(order.fee || 0).toFixed(2)} ${hasData ? '✅' : '⚠️  (não salvo)'}`);
                console.log(`   - Líquido: R$ ${(order.net_value || 0).toFixed(2)} ${hasData ? '✅' : '⚠️  (não salvo)'}`);
                console.log(`   - Método: ${order.payment_method || 'N/A'}`);
                console.log('');
            });
        }

        console.log('✅ Migração verificada com sucesso!\n');
        console.log('📝 Próximos passos para testar:');
        console.log('   1. Abra um pedido no sistema');
        console.log('   2. Clique no botão $ (Confirmar Pagamento)');
        console.log('   3. Selecione "Cartão de Crédito"');
        console.log('   4. Escolha as parcelas');
        console.log('   5. Clique em "Confirmar Pagamento"');
        console.log('   6. Verifique se mostra:');
        console.log('      - Subtotal: ~~R$ XXX,XX~~');
        console.log('      - Taxa: - R$ Y,YY');
        console.log('      - Total a Receber: R$ ZZZ,ZZ\n');
        
        process.exit(0);

    } catch (err) {
        console.error('❌ Erro inesperado:', err.message);
        process.exit(1);
    }
}

testMigration();
