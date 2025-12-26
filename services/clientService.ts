import { supabase } from './supabaseClient';
import { Client } from '../types';

export const clientService = {
    getAll: async (): Promise<Client[]> => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('name');
            
        if (error) throw new Error(error.message);
        
        return (data || []).map((client: any) => ({
            ...client,
            tags: client.tags || []
        }));
    },

    create: async (client: Omit<Client, 'id'>) => {
        const { data, error } = await supabase
            .from('clients')
            .insert([{
                name: client.name,
                mobile: client.phone,
                email: client.email,
                document: client.document,
                type: client.type,
                address: '',
                notes: client.notes,
                tags: client.tags
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        
        return {
            ...data,
            phone: data.mobile,
            tags: data.tags || []
        };
    },

    update: async (client: Client) => {
        const { data, error } = await supabase
            .from('clients')
            .update({
                name: client.name,
                mobile: client.phone,
                email: client.email,
                document: client.document,
                type: client.type,
                notes: client.notes,
                tags: client.tags
            })
            .eq('id', client.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        
        return {
            ...data,
            phone: data.mobile,
            tags: data.tags || []
        };
    },

    delete: async (id: string) => {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    }
};
