import { supabase } from './services/supabaseClient';

async function testMigration() {
    console.log('🧪 Testando migração do banco de dados...\n');
    
    try {
        // Test 1: Check if columns exist
        console.log('1️⃣ Verificando se as colunas existem...');
        const { data: testData, error: testError } = await supabase
            .from('orders')
            .select('id, fee, net_value')
            .limit(1);

        if (testError) {
            console.error('❌ Erro ao verificar colunas:', testError.message);
            console.log('⚠️  As colunas fee e net_value podem não existir ainda.');
            return false;
        }

        console.log('✅ Colunas fee e net_value existem!\n');

        // Test 2: Check existing orders
        console.log('2️⃣ Verificando pedidos existentes...');
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, value, fee, net_value, payment_method')
            .not('payment_method', 'is', null)
            .order('created_at', { ascending: false })
            .limit(5);

        if (ordersError) {
            console.error('❌ Erro ao buscar pedidos:', ordersError.message);
            return false;
        }

        if (!orders || orders.length === 0) {
            console.log('ℹ️  Nenhum pedido com pagamento encontrado.');
            console.log('   Isso é normal se você ainda não confirmou nenhum pagamento.\n');
        } else {
            console.log(`✅ Encontrados ${orders.length} pedidos com pagamento:\n`);
            orders.forEach((order: any) => {
                console.log(`   Pedido #${order.id}:`);
                console.log(`   - Valor: R$ ${order.value?.toFixed(2) || '0.00'}`);
                console.log(`   - Taxa: R$ ${order.fee?.toFixed(2) || '0.00'}`);
                console.log(`   - Líquido: R$ ${order.net_value?.toFixed(2) || '0.00'}`);
                console.log(`   - Método: ${order.payment_method || 'N/A'}`);
                console.log('');
            });
        }

        console.log('✅ Teste concluído com sucesso!\n');
        console.log('📝 Próximos passos:');
        console.log('   1. Abra um pedido no sistema');
        console.log('   2. Confirme o pagamento com cartão');
        console.log('   3. Verifique se mostra: Subtotal, Taxa e Total a Receber');
        console.log('   4. Verifique no Financeiro se o valor está correto\n');
        
        return true;

    } catch (err: any) {
        console.error('❌ Erro inesperado:', err.message);
        return false;
    }
}

testMigration().then(success => {
    process.exit(success ? 0 : 1);
});
