
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export const LoginScreen: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setError('');
        if (!username || !password) {
            setError('Preencha todos os campos');
            return;
        }
        setLoading(true);
        try {
            await login(username.trim(), password);
            navigate('/dashboard');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleLogin();
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 overflow-x-hidden bg-background-light dark:bg-background-dark">
            <div className="w-full max-w-[400px] bg-white dark:bg-[#1a222d] rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
                <div className="flex flex-col items-center pt-10 pb-6 px-6">
                    <div className="w-24 h-24 mb-6 relative flex items-center justify-center bg-primary/10 rounded-full">
                        <div className="w-14 h-14 bg-contain bg-center bg-no-repeat" style={{ backgroundColor: '#307de8', WebkitMask: 'url("https://fonts.gstatic.com/s/i/materialicons/local_laundry_service/v14/24px.svg") no-repeat center / contain', mask: 'url("https://fonts.gstatic.com/s/i/materialicons/local_laundry_service/v14/24px.svg") no-repeat center / contain' }}></div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#111418] dark:text-white text-center">Lavê</h1>
                    <p className="text-[#637288] text-sm font-medium uppercase tracking-wider mt-1 text-center">Lavanderia Guaibim</p>
                    <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight mt-8 text-center">Bem-vindo de volta!</h2>
                    <p className="text-[#637288] text-center mt-2 text-sm">Acesse sua conta para agendar sua lavagem.</p>
                </div>
                <div className="flex flex-col gap-4 px-6 pb-8">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-medium text-center animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}
                    <div className="flex w-full items-stretch rounded-xl bg-[#f0f2f4] dark:bg-[#2a3441] overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
                        <div className="flex items-center justify-center pl-4 text-[#637288]"><span className="material-symbols-outlined">person</span></div>
                        <input 
                            className="form-input flex-1 w-full bg-transparent border-none text-[#111418] dark:text-white placeholder:text-[#637288] h-14 px-4 text-base focus:ring-0" 
                            placeholder="Usuário" 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="flex w-full items-stretch rounded-xl bg-[#f0f2f4] dark:bg-[#2a3441] overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
                        <div className="flex items-center justify-center pl-4 text-[#637288]"><span className="material-symbols-outlined">lock</span></div>
                        <input 
                            className="form-input flex-1 w-full bg-transparent border-none text-[#111418] dark:text-white placeholder:text-[#637288] h-14 px-4 text-base focus:ring-0" 
                            placeholder="Senha" 
                            type={passwordVisible ? 'text' : 'password'} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button className="flex items-center justify-center pr-4 text-[#637288] hover:text-primary transition-colors focus:outline-none" onClick={() => setPasswordVisible(!passwordVisible)}>
                            <span className="material-symbols-outlined">{passwordVisible ? 'visibility_off' : 'visibility'}</span>
                        </button>
                    </div>
                    <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-primary text-sm font-medium hover:text-blue-700 transition-colors">Esqueceu a senha?</Link>
                    </div>
                    <button onClick={handleLogin} disabled={loading} className="flex w-full items-center justify-center rounded-xl bg-primary h-14 text-white text-base font-bold shadow-md hover:bg-blue-600 focus:ring-4 focus:ring-primary/30 transition-all mt-2 disabled:opacity-50">
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </div>

            </div>
            <div className="h-10"></div>
        </div>
    );
};

export const SignUpScreen: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !username || !email || !password || !confirmPassword) return alert('Preencha todos os campos');
        if (password !== confirmPassword) return alert('As senhas não conferem');
        
        setLoading(true);
        try {
            await register(name, username, email, password);
            navigate('/dashboard');
        } catch (error: any) {
            alert('Erro ao cadastrar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
         <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden max-w-md mx-auto bg-surface-light dark:bg-surface-dark shadow-sm">
            <header className="flex items-center bg-surface-light dark:bg-surface-dark p-4 pb-2 justify-between sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="text-[#111418] dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-background-light dark:hover:bg-background-dark rounded-full transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">Cadastro</h2>
            </header>
            <main className="flex-1 flex flex-col pb-8">
                <div className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-surface-light dark:bg-surface-dark min-h-[180px]" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuD-sHzAJRzedAldrLQx2DDrc1KyUEu_FWgkaIalX3Kc_ler8QUgzGLJ1nDoYNC2f8QgsR-G4diEXg5uSoGbEFZ4djGrYh8WKU9T16CgutNIiZF7hPTrSilP8UUiHeP7orylJpJxggNN6ik_asffBYeIhqcTq2jamSn1rOyL8vc8m1Rl3gZGGZHU5okHU1LNWfVheI2qv-Dc0B8PKLX2dYUpG9uxgonV0e6iLUV9QtuhSMPeFOl3FafZ5N3qUWvdAt2ECdfXYVV3ADwU")` }}>
                    <div className="bg-gradient-to-t from-surface-light/90 dark:from-surface-dark/90 to-transparent p-4 pt-12"></div>
                </div>
                <div className="px-4 pt-4 pb-2">
                    <h2 className="text-primary tracking-tight text-[28px] font-bold leading-tight text-left">Bem-vindo à Lavê</h2>
                    <p className="text-[#637288] dark:text-gray-400 text-base font-normal leading-normal pt-2 text-left">Preencha os dados abaixo para criar sua conta na Lavanderia Guaibim.</p>
                </div>
                <div className="flex flex-col gap-4 px-4 py-3">
                    <InputField label="Nome Completo" placeholder="Digite seu nome" icon="person" value={name} onChange={e => setName(e.target.value)} />
                    <InputField label="Usuário" placeholder="Nome de usuário" icon="account_circle" value={username} onChange={e => setUsername(e.target.value)} />
                    <InputField label="E-mail" placeholder="exemplo@email.com" icon="mail" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    <InputField label="Senha" placeholder="Criar senha" icon="visibility" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                    <InputField label="Confirmar Senha" placeholder="Repetir senha" icon="lock" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
                <div className="px-4 pt-6 flex flex-col gap-4">
                    <button onClick={handleRegister} disabled={loading} className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-white font-bold text-base tracking-wide shadow-md hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-50">
                        {loading ? 'Cadastrando...' : 'Cadastrar'}
                    </button>
                    <div className="text-center mt-2">
                        <p className="text-[#637288] dark:text-gray-400 text-sm font-normal">Já tem uma conta? <Link to="/" className="text-primary font-bold hover:underline ml-1">Faça Login</Link></p>
                    </div>
                </div>
                <div className="h-10"></div>
            </main>
        </div>
    );
};

interface InputFieldProps {
    label: string;
    placeholder: string;
    icon: string;
    type?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({ label, placeholder, icon, type = "text", value, onChange }) => (
    <label className="flex flex-col w-full">
        <p className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal pb-2">{label}</p>
        <div className="flex w-full items-stretch rounded-lg focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
            <input 
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-l-lg text-[#111418] dark:text-white dark:bg-[#252b36] focus:outline-0 focus:ring-0 border border-[#dce0e5] dark:border-gray-700 bg-white focus:border-primary h-12 placeholder:text-[#9daabf] p-[15px] border-r-0 text-base font-normal leading-normal" 
                placeholder={placeholder} 
                type={type} 
                value={value}
                onChange={onChange}
            />
            <div className="text-[#9daabf] flex border border-[#dce0e5] dark:border-gray-700 dark:bg-[#252b36] bg-white items-center justify-center pr-[15px] pl-2 rounded-r-lg border-l-0">
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
            </div>
        </div>
    </label>
);

export const ForgotPasswordScreen: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleForgotPassword = async () => {
        if (!email) return alert('Por favor, digite seu e-mail');
        setLoading(true);
        try {
            await authService.forgotPassword(email);
            alert('Sucesso! Verifique seu e-mail para recuperar sua senha.');
            navigate('/');
        } catch (error: any) {
            alert('Erro: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-white dark:bg-background-dark shadow-sm">
            <header className="flex items-center p-4 pb-2 justify-between sticky top-0 bg-white/90 dark:bg-background-dark/90 backdrop-blur-sm z-10">
                <button onClick={() => navigate(-1)} className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-primary dark:text-primary">
                    <span className="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <div className="w-10"></div>
            </header>
            <main className="flex-1 flex flex-col px-6 pb-6 pt-4">
                <div className="flex justify-center py-8">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl transform scale-75"></div>
                        <div className="w-full h-full bg-center bg-contain bg-no-repeat z-10" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuAmnDYr-5ezb_gB_Ake6X2kHnmJ-I_J4Ii61F6IeZzwvRSCKhDgkYQDgGBPBiCp4MAGzPSMpgLJky1wkzbB3JBLF7djYbiaemq2dH2r4yS8QYOEDbkXi6fdBIoRVeFDoofdkWKXvvXPpBKZbAPPsvmmqHIZcB2WZypY4v4CAdCRZbNIWCwS8Z-FhrCrDZWxknXdCh3C00yv1BbhUOW6ZI6rG74ekZaYusOgPQR38HqEH7fx6Q6gccWqUU_0TY4E7y-FHxjhB0I2AYX0")` }}></div>
                    </div>
                </div>
                <div className="flex flex-col items-center text-center gap-2 mb-8">
                    <h1 className="text-[#111418] dark:text-white tracking-tight text-[28px] font-bold leading-tight">Esqueceu sua senha?</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-relaxed max-w-[320px]">Não se preocupe! Insira o e-mail associado à sua conta e enviaremos as instruções para redefinição.</p>
                </div>
                <div className="w-full space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal ml-1">E-mail</label>
                        <div className="relative flex items-center">
                            <span className="absolute left-4 text-gray-400 dark:text-gray-500 flex items-center pointer-events-none"><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mail</span></span>
                            <input 
                                className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-[#111418] dark:text-white dark:bg-gray-800 border border-[#dce0e5] dark:border-gray-700 focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary h-14 placeholder:text-gray-400 pl-11 pr-4 text-base font-normal leading-normal transition-all" 
                                placeholder="exemplo@email.com" 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <button 
                        onClick={handleForgotPassword} 
                        disabled={loading}
                        className="flex w-full items-center justify-center rounded-xl bg-primary px-4 h-14 text-white text-base font-semibold leading-normal tracking-[0.015em] hover:bg-blue-600 active:scale-[0.98] transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                    >
                        {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                    </button>
                </div>
                <div className="flex-1 min-h-[40px]"></div>
                <div className="mt-auto py-6 flex justify-center items-center">
                    <Link to="/" className="group flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                        <span className="material-symbols-outlined group-hover:-translate-x-0.5 transition-transform" style={{ fontSize: '18px' }}>arrow_back</span>
                        <span>Voltar ao Login</span>
                    </Link>
                </div>
            </main>
        </div>
    );
};
