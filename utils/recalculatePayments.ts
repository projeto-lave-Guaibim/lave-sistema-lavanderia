// Script to recalculate all existing payments with current fee configuration
// Run this in the browser console after configuring the correct fees

import { orderService } from './services/orderService';
import { feeUtils } from './utils/feeUtils';

export async function recalculateAllPayments() {
    try {
        console.log('🔄 Starting payment recalculation...');
        
        // Get all orders
        const allOrders = await orderService.getAll();
        
        // Filter only paid orders
        const paidOrders = allOrders.filter(order => order.isPaid && order.payment_method);
        
        console.log(`Found ${paidOrders.length} paid orders to recalculate`);
        
        // Get current fee configuration
        const currentFees = feeUtils.getFees();
        
        let updated = 0;
        let errors = 0;
        
        for (const order of paidOrders) {
            try {
                const paymentMethod = order.payment_method!;
                
                // Recalculate with current fees
                const netValue = feeUtils.calculateNetValue(order.value, paymentMethod, currentFees);
                const fee = order.value - netValue;
                
                // Get fee percentage
                const feePercentage = currentFees[paymentMethod] || 0;
                
                console.log(`Order #${order.id}: ${paymentMethod} - Old: ${order.feePercentage}% → New: ${feePercentage}%`);
                
                // Update in database
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
        
        return { updated, errors, total: paidOrders.length };
    } catch (error) {
        console.error('Failed to recalculate payments:', error);
        throw error;
    }
}

// To use: Copy this file content and run recalculateAllPayments() in console
