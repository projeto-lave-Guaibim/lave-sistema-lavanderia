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
            date: new Date(t.date).toLocaleDateString('pt-BR'), 
            paid: t.paid,
            clientName: t.client_name,
            icon: t.icon
        }));
    },

    create: async (transaction: Omit<Transaction, 'id'>) => {
        const { data, error } = await supabase
            .from('finance')
            .insert([{
                description: transaction.description,
                amount: transaction.amount,
                type: transaction.type,
                category: ((transaction as any).category) || null,
                date: transaction.date,
                paid: transaction.paid,
                client_name: transaction.clientName,
                icon: transaction.icon
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    delete: async (id: string) => {
        const { error } = await supabase
            .from('finance')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    }
};
