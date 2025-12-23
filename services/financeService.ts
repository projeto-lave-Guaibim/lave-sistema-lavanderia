import { supabase } from './supabaseClient';
import { Transaction } from '../types';

export const financeService = {
    getAll: async (): Promise<Transaction[]> => {
        const { data, error } = await supabase
            .from('finance')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw new Error(error.message);

        return data.map((t: any) => ({
            ...t,
            amount: Number(t.amount),
            date: new Date(t.date).toLocaleDateString('pt-BR'), // Format date
            // paid is boolean in DB, so no conversion needed if schema matches
            paid: t.paid
        }));
    },

    create: async (transaction: Omit<Transaction, 'id'>) => {
        const { data, error } = await supabase
            .from('finance')
            .insert([{
                description: transaction.description,
                amount: transaction.amount,
                type: transaction.type,
                // category: transaction.category, // Add category if needed in UI/Types
                date: new Date().toISOString().split('T')[0], // Default to today
                paid: transaction.paid
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    delete: async (id: number) => {
        const { error } = await supabase
            .from('finance')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    }
};
