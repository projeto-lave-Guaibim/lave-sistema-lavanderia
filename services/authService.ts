import { supabase } from './supabaseClient';

export interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    role?: 'admin' | 'user';
}

export interface AuthResponse {
    message: string;
    user?: User;
    status?: string;
}

export const authService = {
    login: async (username: string, password: string): Promise<User> => {
        // Supabase Auth uses email. We need to map username -> email.
        
        let targetEmail = '';
        let targetRole = 'user';

        // EMERGENCY OVERRIDE: Bypass DB lookup for known admin
        if (username.toLowerCase() === 'lavanderia') {
            console.log('⚡ Using hardcoded bypass for Lavanderia');
            targetEmail = 'contato.laveguaibim@gmail.com';
            targetRole = 'admin';
        } else {
            // Standard flow for other users
            console.log('Attempting login DB lookup for:', username);
            const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .select('email, role')
                .eq('username', username)
                .single();
                
            if (profileError) {
                console.error('Profile lookup error:', profileError);
                if (profileError.code === 'PGRST116') {
                    throw new Error('Usuário não encontrado');
                }
                throw new Error('Erro ao buscar dados do usuário: ' + profileError.message);
            }
            if (!userProfile) throw new Error('Usuário não encontrado');
            
            targetEmail = userProfile.email;
            targetRole = userProfile.role || 'user';
        }

        console.log('Attempting auth with email:', targetEmail);
        const { data, error } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: password
        });

        if (error) {
            console.error('Auth error:', error);
            if (error.message === 'Invalid login credentials') {
                throw new Error('Senha incorreta.');
            }
            throw new Error('Erro de autenticação: ' + error.message);
        }
        
        console.log('Auth successful, returning user object');
        // Return user info. Safe access to user_metadata
        return {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || '',
            username: username,
            role: targetRole as 'admin' | 'user'
        };
    },

    register: async (name: string, username: string, email: string, password: string): Promise<User> => {
        // 1. Sign up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
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
        if (!data.user) throw new Error('Erro ao criar usuário');

        // 2. Create entry in 'users' table (our public profile table)
        // We need this for the username lookup above.
        const { error: dbError } = await supabase
            .from('users')
            .insert([{
                id: data.user.id, // Link to Auth ID
                name,
                username,
                email,
                role: 'user',
                // password: password // DO NOT STORE PASSWORD HERE ANYMORE
            }]);

        if (dbError) {
            // If DB insert fails, we should ideally rollback auth user, but for MVP just throw
            throw new Error('Erro ao salvar dados do usuário: ' + dbError.message);
        }

        return {
            id: data.user.id,
            name,
            username,
            email,
            role: 'user'
        };
    },

    changePassword: async (username: string, oldPassword: string, newPassword: string): Promise<void> => {
        // 1. Verify old password by trying to sign in? 
        // Or just use updateUser if we are already logged in.
        // Assuming we are logged in when calling this.
        
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) throw new Error(error.message);
    },

    forgotPassword: async (email: string): Promise<void> => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw new Error(error.message);
    },

    logout: async (): Promise<void> => {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
    },

    getCurrentUser: async (): Promise<User | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        // Fetch name, username, and role from users table
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('name, username, role')
            .eq('id', user.id)
            .single();
        
        if (profileError) {
            console.error('Failed to fetch user profile:', profileError);
        }

        return {
            id: user.id,
            email: user.email!,
            name: userProfile?.name || user.user_metadata.name || '',
            username: userProfile?.username || user.user_metadata.username || '',
            role: userProfile?.role || 'user'
        };
    }
};
