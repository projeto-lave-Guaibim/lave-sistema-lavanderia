import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

// Create a separate client for admin operations that doesn't persist session
// This allows creating new users without logging out the current admin
const SUPABASE_URL = 'https://uufmwhhkosxmfozsgzaf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1Zm13aGhrb3N4bWZvenNnemFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDQ2NzksImV4cCI6MjA3NjA4MDY3OX0.mC06yvRwvR0PM2ONVHnEbvBOTkbjrSWvraS2BOPTzVk';

const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'admin-auth-token'
    }
});

export const adminService = {
    createUser: async (name: string, username: string, email: string, password: string, role: 'admin' | 'user' = 'user') => {
        // Insert user directly into users table with hashed password
        const { error } = await supabase.rpc('create_user_with_password', {
            p_auth_user_id: null, // Not using Supabase Auth anymore
            p_name: name,
            p_username: username,
            p_email: email,
            p_password: password,
            p_role: role
        });

        if (error) {
            throw new Error('Erro ao criar usuário: ' + error.message);
        }

        return { success: true };
    },

    getAllUsers: async () => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('name');
            
        if (error) throw new Error(error.message);
        return data;
    },

    updateUser: async (userId: string, updates: { name?: string; username?: string; email?: string; role?: 'admin' | 'user' }) => {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    deleteUser: async (userId: string) => {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) throw new Error(error.message);
    },

    resetPassword: async (userId: string, newPassword: string) => {
        // Get auth_user_id from users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('auth_user_id')
            .eq('id', userId)
            .single();

        if (userError || !userData?.auth_user_id) {
            throw new Error('Usuário não encontrado ou sem conta de autenticação');
        }

        // Note: Password reset via client SDK is limited
        // This is a workaround - in production, use Supabase Admin API
        throw new Error('Redefinição de senha requer acesso admin ao Supabase. Use o dashboard do Supabase para redefinir senhas.');
    }
};

