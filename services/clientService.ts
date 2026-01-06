import { supabase } from './supabaseClient';
import { Client } from '../types';

export const clientService = {
    getAll: async (includeHidden: boolean = false): Promise<Client[]> => {
        let query = supabase
            .from('clients')
            .select('*');
        
        // Filter out hidden clients by default
        if (!includeHidden) {
            query = query.or('is_hidden.is.null,is_hidden.eq.false');
        }
        
        const { data, error } = await query.order('name');
            
        if (error) throw new Error(error.message);
        
        return (data || []).map((client: any) => ({
            ...client,
            phone: client.mobile, // Map mobile from DB to phone for frontend
            tags: client.tags || [],
            isHidden: client.is_hidden || false
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
    },

    hide: async (id: string) => {
        const { error } = await supabase
            .from('clients')
            .update({ is_hidden: true })
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    unhide: async (id: string) => {
        const { error } = await supabase
            .from('clients')
            .update({ is_hidden: false })
            .eq('id', id);

        if (error) throw new Error(error.message);
    }
};
