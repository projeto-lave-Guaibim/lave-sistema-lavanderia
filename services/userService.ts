import { supabase } from './supabaseClient';

export interface User {
    id: string;
    auth_user_id?: string;
    name: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
    created_at?: string;
}

export const userService = {
    getAll: async (): Promise<User[]> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('name');
        
        if (error) throw new Error(error.message);
        return data as User[];
    },

    getById: async (id: string): Promise<User> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw new Error(error.message);
        return data as User;
    },

    create: async (user: { name: string; username: string; email: string; password: string; role: 'admin' | 'user' }): Promise<User> => {
        // First, create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true
        });

        if (authError) throw new Error(authError.message);

        // Then, create user record in public.users table
        const { data, error } = await supabase
            .from('users')
            .insert([{
                auth_user_id: authData.user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role
            }])
            .select()
            .single();

        if (error) {
            // Rollback: delete auth user if table insert fails
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw new Error(error.message);
        }

        return data as User;
    },

    update: async (id: string, updates: Partial<User>): Promise<User> => {
        const { data, error } = await supabase
            .from('users')
            .update({
                name: updates.name,
                username: updates.username,
                email: updates.email,
                role: updates.role
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as User;
    },

    delete: async (id: string): Promise<void> => {
        // Get auth_user_id before deleting
        const { data: userData } = await supabase
            .from('users')
            .select('auth_user_id')
            .eq('id', id)
            .single();

        // Delete from public.users table
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);

        // Delete from auth.users if auth_user_id exists
        if (userData?.auth_user_id) {
            await supabase.auth.admin.deleteUser(userData.auth_user_id);
        }
    },

    resetPassword: async (userId: string, newPassword: string): Promise<void> => {
        // Get auth_user_id
        const { data: userData } = await supabase
            .from('users')
            .select('auth_user_id')
            .eq('id', userId)
            .single();

        if (!userData?.auth_user_id) {
            throw new Error('Usuário não possui conta de autenticação');
        }

        // Update password in Supabase Auth
        const { error } = await supabase.auth.admin.updateUserById(
            userData.auth_user_id,
            { password: newPassword }
        );

        if (error) throw new Error(error.message);
    }
};
