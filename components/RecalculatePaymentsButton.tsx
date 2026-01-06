import React, { useState } from 'react';
import { orderService } from '../services/orderService';
import { feeUtils } from '../utils/feeUtils';

export const RecalculatePaymentsButton: React.FC = () => {
    const [isRecalculating, setIsRecalculating] = useState(false);

    const handleRecalculate = async () => {
        if (!confirm('⚠️ Isso vai recalcular TODOS os pagamentos com as taxas atuais. Deseja continuar?')) {
            return;
        }

        setIsRecalculating(true);

        try {
            console.log('🔄 Starting payment recalculation...');
            
            const allOrders = await orderService.getAll();
            const paidOrders = allOrders.filter(order => order.isPaid && order.payment_method);
            
            console.log(`Found ${paidOrders.length} paid orders to recalculate`);
            
            const currentFees = feeUtils.getFees();
            
            let updated = 0;
            let errors = 0;
            
            for (const order of paidOrders) {
                try {
                    const paymentMethod = order.payment_method!;
                    const netValue = feeUtils.calculateNetValue(order.value, paymentMethod, currentFees);
                    const fee = order.value - netValue;
                    const feePercentage = currentFees[paymentMethod] || 0;
                    
                    console.log(`Order #${order.id}: ${paymentMethod} - Old: ${order.feePercentage}% → New: ${feePercentage}%`);
                    
                    await orderService.updateStatus(
                        order.id, 
                        order.status, 
                        paymentMethod, 
                        fee, 
                        netValue, 
                        feePercentage
                    );
                    
                    updated++;
                } catch (error) {
                    console.error(`Error updating order #${order.id}:`, error);
                    errors++;
                }
            }
            
            console.log(`✅ Recalculation complete!`);
            console.log(`   Updated: ${updated}`);
            console.log(`   Errors: ${errors}`);
            
            alert(`✅ Recálculo concluído!\n\nAtualizados: ${updated}\nErros: ${errors}\nTotal: ${paidOrders.length}`);
            
            // Refresh page to show updated values
            window.location.reload();
            
        } catch (error) {
            console.error('Failed to recalculate payments:', error);
            alert('❌ Erro ao recalcular pagamentos. Veja o console para detalhes.');
        } finally {
            setIsRecalculating(false);
        }
    };

    return (
        <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Recalcular todos os pagamentos com as taxas atuais"
        >
            <span className={`material-symbols-outlined text-lg ${isRecalculating ? 'animate-spin' : ''}`}>
                {isRecalculating ? 'progress_activity' : 'refresh'}
            </span>
            <span className="hidden sm:inline">{isRecalculating ? 'Recalculando...' : 'Recalcular'}</span>
        </button>
    );
};
