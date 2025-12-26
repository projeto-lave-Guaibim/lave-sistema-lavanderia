import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing session on mount
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const sessionToken = localStorage.getItem('user_session');
            if (sessionToken) {
                // Decode session token to get user ID
                const decoded = atob(sessionToken);
                const userId = decoded.split(':')[0];

                // Fetch user data from database
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) throw error;

                setUser({
                    id: data.id,
                    name: data.name,
                    username: data.username,
                    email: data.email,
                    role: data.role
                });
            }
        } catch (error) {
            console.error('Error checking session:', error);
            localStorage.removeItem('user_session');
        } finally {
            setIsLoading(false);
        }
    };


    const login = async (username: string, password: string) => {
        try {
            // Verify password using PostgreSQL function
            const { data, error } = await supabase.rpc('verify_user_password', {
                p_username: username,
                p_password: password
            });

            if (error) throw error;

            if (!data || data.length === 0) {
                throw new Error('Usuário ou senha incorretos');
            }

            const userData = data[0];

            // Create a session token (simplified - in production use proper JWT)
            const sessionToken = btoa(`${userData.user_id}:${Date.now()}`);
            localStorage.setItem('user_session', sessionToken);

            // Set user data
            setUser({
                id: userData.user_id,
                name: userData.user_name,
                username: username,
                email: userData.user_email,
                role: userData.user_role
            });
        } catch (error: any) {
            console.error('Login error:', error);
            throw new Error(error.message || 'Erro ao fazer login');
        }
    };

    const logout = async () => {
        try {
            localStorage.removeItem('user_session');
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
