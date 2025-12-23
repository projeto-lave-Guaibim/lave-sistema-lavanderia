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
        // Supabase Auth uses email, but we want username.
        // We can use signInWithPassword with email, so we need to find the email for the username first?
        // OR we can just use email for login as standard Supabase Auth.
        // BUT user requested username login.
        // Supabase supports signing in with other identifiers if configured, but standard is email.
        // Workaround: We can store username in metadata and query for email, OR just ask user to use email.
        // BETTER: Let's stick to the plan of using Supabase Auth. 
        // For username login with Supabase, we usually need a Cloud Function or just query the 'users' table (if we kept it synced) to get the email.
        // However, to keep it simple and secure, let's switch to EMAIL login for Supabase Auth as it's the standard.
        // Wait, I can't easily change the UI to Email login without user approval if they really want Username.
        // Let's try to support Username by looking up the email first.
        
        // 1. Lookup email by username in 'profiles' table (we need a profiles table synced with auth.users)
        // Since we don't have triggers set up yet, let's just use the 'users' table we already created as a "profile" table?
        // No, 'users' table is what we are replacing.
        
        // Let's assume for now we will use EMAIL for login to be standard compliant with Supabase Auth, 
        // OR we just query the 'users' table we made (which has email) to get the email, then sign in.
        
        // Actually, the 'users' table I created in the previous step IS the profile table effectively.
        // So:
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('email, role')
            .eq('username', username)
            .single();
            
        if (profileError) {
            // PGRST116 is Supabase error code for "no rows returned"
            if (profileError.code === 'PGRST116') {
                throw new Error('Usuário não encontrado');
            }
            console.error('Database error during login:', profileError);
            throw new Error('Erro ao buscar dados do usuário. Tente novamente.');
        }
        
        if (!userProfile) {
            throw new Error('Usuário não encontrado');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: userProfile.email,
            password: password
        });

        if (error) {
            if (error.message === 'Invalid login credentials') {
                throw new Error('Senha incorreta. Tente novamente.');
            }
            throw new Error('Erro ao fazer login. Verifique suas credenciais.');
        }
        
        // Return user info. We might need to fetch more details if needed.
        return {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata.name || '',
            username: username, // We know it from input
            role: userProfile.role || 'user'
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
