import { supabase } from './supabaseClient';
import { OrderItem } from '../types';

export const orderItemService = {
    // Get all items for a specific order
    getByOrderId: async (orderId: number): Promise<OrderItem[]> => {
        const { data, error } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId)
            .order('id', { ascending: true });

        if (error) throw new Error(error.message);
        return data || [];
    },

    // Create a new order item
    create: async (item: Omit<OrderItem, 'id'>): Promise<OrderItem> => {
        const { data, error } = await supabase
            .from('order_items')
            .insert([item])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    // Create multiple order items at once
    createMany: async (items: Omit<OrderItem, 'id'>[]): Promise<OrderItem[]> => {
        const { data, error } = await supabase
            .from('order_items')
            .insert(items)
            .select();

        if (error) throw new Error(error.message);
        return data;
    },

    // Update an order item
    update: async (id: number, item: Partial<OrderItem>): Promise<void> => {
        const { error } = await supabase
            .from('order_items')
            .update(item)
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    // Delete an order item
    delete: async (id: number): Promise<void> => {
        const { error } = await supabase
            .from('order_items')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    // Delete all items for an order
    deleteByOrderId: async (orderId: number): Promise<void> => {
        const { error } = await supabase
            .from('order_items')
            .delete()
            .eq('order_id', orderId);

        if (error) throw new Error(error.message);
    },

    // Calculate total for order items
    calculateTotal: (items: OrderItem[]): number => {
        return items.reduce((sum, item) => sum + item.subtotal, 0);
    }
};
