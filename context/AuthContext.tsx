import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';

interface AuthContextData {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (name: string, username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 1. Check active session on mount
        authService.getCurrentUser().then(user => {
            setUser(user);
            setIsLoading(false);
        }).catch(() => {
            setIsLoading(false);
        });

        // 2. Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth event:', event, 'Has session:', !!session);
            
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsLoading(false);
            } else if (session?.user) {
                // For SIGNED_IN, INITIAL_SESSION, TOKEN_REFRESHED - fetch full user data
                try {
                    const currentUser = await authService.getCurrentUser();
                    if (currentUser) {
                        setUser(currentUser);
                    }
                } catch (error) {
                    console.error('Error fetching user on auth change:', error);
                }
                setIsLoading(false);
            } else {
                setIsLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const login = async (username: string, password: string) => {
        await authService.login(username, password);
        // Fetch the user with correct role from database
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
    };

    const register = async (name: string, username: string, email: string, password: string) => {
        await authService.register(name, username, email, password);
        // State update handled by onAuthStateChange
    };

    const logout = async () => {
        await authService.logout();
        // State update handled by onAuthStateChange
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
