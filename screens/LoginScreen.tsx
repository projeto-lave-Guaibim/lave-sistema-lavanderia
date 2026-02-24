import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginScreen: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!username || !password) {
            setError('Por favor, preencha todos os campos');
            return;
        }

        setLoading(true);
        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#eef0f3] dark:bg-[#111821] flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Brand */}
                <div className="text-center mb-6">
                    <div className="inline-flex w-14 h-14 items-center justify-center bg-primary rounded mb-3">
                        <span className="material-symbols-outlined filled text-white text-3xl">local_laundry_service</span>
                    </div>
                    <h1 className="text-2xl font-bold text-primary tracking-tight">Lavê</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sistema de Gestão de Lavanderia</p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-[#1a222d] rounded border border-gray-200 dark:border-gray-700 shadow-sm">
                    {/* Card header */}
                    <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e2a38] rounded-t">
                        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Acesso ao Sistema</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                                Usuário
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">
                                    person
                                </span>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-8 pr-3 h-9 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm transition-all"
                                    placeholder="Digite seu usuário"
                                    disabled={loading}
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                                Senha
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">
                                    lock
                                </span>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-8 pr-3 h-9 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm transition-all"
                                    placeholder="Digite sua senha"
                                    disabled={loading}
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2.5 flex items-center gap-2">
                                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[16px]">error</span>
                                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white font-bold h-9 px-4 rounded text-sm shadow-sm hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                    Entrando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[16px]">login</span>
                                    Entrar
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[10px] text-gray-400 mt-4">
                    © {new Date().getFullYear()} Lavê. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
};

export default LoginScreen;
