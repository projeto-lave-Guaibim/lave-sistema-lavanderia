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
        // 1. Create user in Auth using the non-persisting client
        const { data, error } = await adminClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    username
                }
            }
        });

        if (error) throw new Error(error.message);
        if (!data.user) throw new Error('Erro ao criar usuário no Auth');

        // 2. Insert into public users table using the MAIN client (which has the Admin session)
        // We use the main client because the temp client is not logged in (it just signed up a new user, but maybe we want to use the Admin's permissions to write to the table if RLS requires it)
        // Actually, since we just signed up, the temp client MIGHT have a session for the new user.
        // But let's use the main client to ensure we are writing as the authenticated Admin (if RLS allows admins to write).
        // If RLS is open, it doesn't matter.
        
        const { error: dbError } = await supabase
            .from('users')
            .insert([{
                id: data.user.id,
                name,
                username,
                email,
                role
            }]);

        if (dbError) {
            // If DB insert fails, we should ideally delete the auth user, but we can't do that easily with client SDK.
            throw new Error('Usuário criado no Auth, mas falha ao salvar dados: ' + dbError.message);
        }

        return data.user;
    },

    getAllUsers: async () => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('name');
            
        if (error) throw new Error(error.message);
        return data;
    }
};
