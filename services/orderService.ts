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
            service: o.service_type, // Map service_type to service
            details: o.description, // Map description to details
            timestamp: new Date(o.created_at).toLocaleString('pt-BR'), // Format date
            status: o.status,
            value: Number(o.value),
            extras: o.extras || [], // Map extras
            client: {
                id: o.client_id,
                name: o.client_name,
                phone: '', // We might need to join clients table to get phone if needed
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
                extras: order.extras || []
                // created_at defaults to now()
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
                extras: order.extras || []
                // delivery_date: order.deliveryDate // Add if we have this in types
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
