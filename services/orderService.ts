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
            timestamp: new Date(o.created_at).toLocaleString('pt-BR'), 
            status: o.status,
            value: Number(o.value),
            extras: o.extras || [],
            discount: o.discount || 0,
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

    updateStatus: async (id: number, status: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', id);

        if (error) throw new Error(error.message);
    }
};
