import { supabase } from './supabaseClient';
import { Order } from '../types';

export const orderService = {
    getAll: async (): Promise<Order[]> => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        return data.map((o: any) => ({
            id: o.id,
            service: o.service_type, 
            details: o.description, 
            payment_method: o.payment_method,
            timestamp: new Date(o.created_at).toLocaleString('pt-BR'), 
            status: o.status,
            value: Number(o.value),
            extras: o.extras || [],
            discount: o.discount || 0,
            isPaid: !!o.payment_method, // Paid if payment_method is set
            fee: o.fee || 0,
            netValue: o.net_value || 0, // Map from snake_case DB column
            payment_date: o.payment_date,
            feePercentage: o.fee_percentage || 0,
            client: {
                id: o.client_id,
                name: o.client_name,
                phone: '', 
                tags: [],
                memberSince: ''
            }
        }));
    },

    create: async (order: Order) => {
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                client_id: order.client.id,
                client_name: order.client.name,
                service_type: order.service,
                description: order.details,
                status: order.status,
                value: order.value,
                extras: order.extras || [],
                discount: order.discount || 0
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    update: async (order: Order) => {
        const { data, error } = await supabase
            .from('orders')
            .update({
                client_id: order.client.id,
                client_name: order.client.name,
                service_type: order.service,
                description: order.details,
                status: order.status,
                value: order.value,
                extras: order.extras || [],
                discount: order.discount || 0
            })
            .eq('id', order.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    delete: async (id: number) => {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    updateStatus: async (id: number, status: string, paymentMethod?: string, fee?: number, netValue?: number, feePercentage?: number) => {
        const updates: any = { status };
        if (paymentMethod) {
            updates.payment_method = paymentMethod;
            updates.payment_date = new Date().toISOString(); // Save current timestamp
        }
        if (typeof fee === 'number') {
            updates.fee = fee;
        }
        if (typeof netValue === 'number') {
            updates.net_value = netValue;
        }
        if (typeof feePercentage === 'number') {
            updates.fee_percentage = feePercentage;
        }

        const { error } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    clearPayment: async (id: number) => {
        const { error } = await supabase
            .from('orders')
            .update({
                payment_method: null,
                fee: 0,
                net_value: 0
            })
            .eq('id', id);

        if (error) throw new Error(error.message);
    }
};
