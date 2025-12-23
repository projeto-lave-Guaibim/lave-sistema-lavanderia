import { supabase } from './supabaseClient';
import { StockItem } from '../types';

export const stockService = {
    getAll: async (): Promise<StockItem[]> => {
        const { data, error } = await supabase
            .from('stock')
            .select('*')
            .order('name');

        if (error) throw new Error(error.message);

        return data.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: Number(item.quantity),
            minQuantity: Number(item.min_quantity), // Map min_quantity
            unit: item.unit,
            category: '', // Add category if needed in DB
            volume: item.unit // Map unit to volume
        }));
    },

    create: async (item: Omit<StockItem, 'id'>) => {
        const { data, error } = await supabase
            .from('stock')
            .insert([{
                name: item.name,
                quantity: item.quantity,
                min_quantity: item.minQuantity,
                unit: item.volume
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    update: async (item: StockItem) => {
        const { data, error } = await supabase
            .from('stock')
            .update({
                name: item.name,
                quantity: item.quantity,
                min_quantity: item.minQuantity,
                unit: item.volume
            })
            .eq('id', item.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }
};
