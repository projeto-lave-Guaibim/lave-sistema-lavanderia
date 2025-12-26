import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const RegisterScreen: React.FC = () => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!name || !username || !email || !password) {
            setError('Por favor, preencha todos os campos');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            // Create user directly in database
            const { error: createError } = await supabase.rpc('create_user_with_password', {
                p_auth_user_id: null,
                p_name: name,
                p_username: username,
                p_email: email,
                p_password: password,
                p_role: 'admin' // First user is always admin
            });

            if (createError) throw createError;

            alert('Conta criada com sucesso! Faça login para continuar.');
            navigate('/login');
        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background-light to-primary/5 dark:from-background-dark dark:via-background-dark dark:to-primary/10 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex size-20 items-center justify-center bg-gradient-to-br from-primary to-primary-dark rounded-3xl shadow-2xl shadow-primary/30 mb-4">
                        <span className="material-symbols-outlined filled text-white text-5xl">local_laundry_service</span>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-2">
                        Lavê
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 italic">Cuidar bem é a nossa essência.</p>
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                        Criar Conta
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                        Crie sua conta de administrador
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Nome Completo
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    person
                                </span>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="Seu nome completo"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Usuário (Login)
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    badge
                                </span>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="Escolha um nome de usuário"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                E-mail
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    email
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="seu@email.com"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Senha
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    lock
                                </span>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="Mínimo 6 caracteres"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-lg">error</span>
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    Criando conta...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">person_add</span>
                                    Criar Conta
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Já tem uma conta?{' '}
                            <button
                                onClick={() => navigate('/login')}
                                className="text-primary font-semibold hover:underline"
                            >
                                Fazer login
                            </button>
                        </p>
                    </div>
                </div>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    © 2024 Lavê. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
};

export default RegisterScreen;
