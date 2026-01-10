import { supabase } from './supabaseClient';
import { Transaction } from '../types';

export const financeService = {
    getAll: async (): Promise<Transaction[]> => {
        const { data, error } = await supabase
            .from('finance')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw new Error(error.message);

        return data.map((t: any) => {
            let group = t.group; // Try to get from column if it exists (future proof)
            let category = t.category;

            // If no group column but category has separator, split it
            // Format: "Group :: Category"
            if (!group && category && typeof category === 'string' && category.includes(' :: ')) {
                const parts = category.split(' :: ');
                if (parts.length === 2) {
                    group = parts[0];
                    category = parts[1];
                }
            }

            return {
                ...t,
                amount: Number(t.amount),
                date: new Date(t.date).toLocaleDateString('pt-BR'), 
                paid: t.paid,
                clientName: t.client_name,
                icon: t.icon,
                category: category,
                group: group
            };
        });
    },

    create: async (transaction: Omit<Transaction, 'id'>) => {
        // Combine group and category for storage since 'group' column might not exist
        const categoryToSave = transaction.group && transaction.category
            ? `${transaction.group} :: ${transaction.category}`
            : transaction.category;

        const { data, error } = await supabase
            .from('finance')
            .insert([{
                description: transaction.description,
                amount: transaction.amount,
                type: transaction.type,
                category: categoryToSave || null,
                // Do not send 'group' property to avoid schema error
                date: transaction.date,
                paid: transaction.paid,
                client_name: transaction.clientName,
                icon: transaction.icon
            }])
            .select('id, description, amount, type, category, date, paid, client_name, icon')
            .single();

        if (error) throw new Error(error.message);
        return data; // The returned data might have the combined string, but getAll handles it
    },

    getById: async (id: string): Promise<Transaction | null> => {
        const { data, error } = await supabase
            .from('finance')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw new Error(error.message);
        }

        let group = data.group;
        let category = data.category;

        if (!group && category && typeof category === 'string' && category.includes(' :: ')) {
            const parts = category.split(' :: ');
            if (parts.length === 2) {
                group = parts[0];
                category = parts[1];
            }
        }

        return {
            ...data,
            amount: Number(data.amount),
            date: data.date, // Keep original format
            paid: data.paid,
            clientName: data.client_name,
            icon: data.icon,
            category: category,
            group: group
        };
    },

    update: async (id: string, transaction: Omit<Transaction, 'id'>) => {
        const categoryToSave = transaction.group && transaction.category
            ? `${transaction.group} :: ${transaction.category}`
            : transaction.category;

        const { data, error } = await supabase
            .from('finance')
            .update({
                description: transaction.description,
                amount: transaction.amount,
                type: transaction.type,
                category: categoryToSave || null,
                // Do not send 'group' property
                date: transaction.date,
                paid: transaction.paid,
                client_name: transaction.clientName,
                icon: transaction.icon
            })
            .eq('id', id)
            .select('id, description, amount, type, category, date, paid, client_name, icon')
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
