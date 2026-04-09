import { supabase } from './supabaseClient';

export interface ContractRule {
    id: string;
    type: 'base_rate' | 'tier';
    label: string;
    min_kg: number;
    price: number;
    created_at?: string;
}

export const contractRuleService = {
    async getAll(): Promise<ContractRule[]> {
        const { data, error } = await supabase
            .from('contract_rules')
            .select('*')
            .order('min_kg', { ascending: true });
        
        if (error) throw error;
        return data || [];
    },

    async create(rule: Omit<ContractRule, 'id' | 'created_at'>): Promise<ContractRule> {
        const { data, error } = await supabase
            .from('contract_rules')
            .insert([rule])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async update(id: string, rule: Partial<ContractRule>): Promise<ContractRule> {
        const { data, error } = await supabase
            .from('contract_rules')
            .update(rule)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('contract_rules')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    }
};
