import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

import { authService } from '../services/authService';

import { adminService } from '../services/adminService';

const UserScreen: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
    const [isManageUsersOpen, setIsManageUsersOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <Header title="Meu Perfil" />
            
            <main className="flex-1 overflow-y-auto p-4 pb-24">
                <div className="flex flex-col items-center py-8">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-primary text-4xl">person</span>
                    </div>
                    <h2 className="text-xl font-bold text-[#111418] dark:text-white">{user?.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400">@{user?.username}</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">{user?.email}</p>
                    <span className="mt-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold uppercase rounded-full">
                        {user?.role || 'Usuário'}
                    </span>
                    {/* Debug Info */}
                    <p className="text-xs text-gray-300 mt-1">Role: {user?.role || 'undefined'}</p>
                </div>

                <div className="space-y-4">
                    {user?.role === 'admin' && (
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4">Administração</h3>
                            <button 
                                onClick={() => setIsManageUsersOpen(true)}
                                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">group_add</span>
                                    <span className="text-[#111418] dark:text-white font-medium">Gerenciar Usuários</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                            </button>
                        </div>
                    )}

                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4">Configurações</h3>
                        
                        <div className="space-y-2">
                            <button 
                                onClick={() => setIsChangePasswordOpen(true)}
                                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-500">lock</span>
                                    <span className="text-[#111418] dark:text-white font-medium">Alterar Senha</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                            </button>
                            
                            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-500">notifications</span>
                                    <span className="text-[#111418] dark:text-white font-medium">Notificações</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        Sair da Conta
                    </button>
                </div>
            </main>
            
            {isChangePasswordOpen && <ChangePasswordModal onClose={() => setIsChangePasswordOpen(false)} />}
            {isManageUsersOpen && <ManageUsersModal onClose={() => setIsManageUsersOpen(false)} />}
        </div>
    );
};

export default UserScreen;

const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user } = useAuth();
    const [oldPassword, setOldPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) return alert('Preencha todos os campos');
        if (newPassword !== confirmPassword) return alert('As novas senhas não conferem');
        if (!user?.username) return alert('Erro ao identificar usuário');

        setLoading(true);
        try {
            await authService.changePassword(user.username, oldPassword, newPassword);
            alert('Senha alterada com sucesso!');
            onClose();
        } catch (error: any) {
            alert('Erro ao alterar senha: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1a222d] rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-xl font-bold text-[#111418] dark:text-white mb-4">Alterar Senha</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">Senha Atual</label>
                        <input 
                            type="password" 
                            className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none text-[#111418] dark:text-white focus:ring-2 focus:ring-primary/50"
                            value={oldPassword}
                            onChange={e => setOldPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">Nova Senha</label>
                        <input 
                            type="password" 
                            className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none text-[#111418] dark:text-white focus:ring-2 focus:ring-primary/50"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">Confirmar Nova Senha</label>
                        <input 
                            type="password" 
                            className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none text-[#111418] dark:text-white focus:ring-2 focus:ring-primary/50"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button 
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 h-12 rounded-xl bg-primary text-white font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ManageUsersModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [users, setUsers] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isAdding, setIsAdding] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<any | null>(null);

    // Form states
    const [name, setName] = React.useState('');
    const [username, setUsername] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [role, setRole] = React.useState<'admin' | 'user'>('user');
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await adminService.getAllUsers();
            setUsers(data || []);
        } catch (error) {
            console.error(error);
            alert('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!name || !username || !email || !password) return alert('Preencha todos os campos');
        setSubmitting(true);
        try {
            await adminService.createUser(name, username, email, password, role);
            alert('Usuário criado com sucesso!');
            setIsAdding(false);
            // Reset form
            setName(''); setUsername(''); setEmail(''); setPassword(''); setRole('user');
            loadUsers();
        } catch (error: any) {
            alert('Erro ao criar usuário: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditUser = (user: any) => {
        setEditingUser(user);
        setName(user.name);
        setUsername(user.username);
        setEmail(user.email);
        setRole(user.role);
        setPassword(''); // Don't pre-fill password
    };

    const handleUpdateUser = async () => {
        if (!name || !username || !email) return alert('Preencha todos os campos obrigatórios');
        setSubmitting(true);
        try {
            // Update user data
            await adminService.updateUser(editingUser.id, { name, username, email, role });
            
            // Update password if provided
            if (password) {
                await adminService.resetPassword(editingUser.id, password);
            }
            
            alert('Usuário atualizado com sucesso!');
            setEditingUser(null);
            setName(''); setUsername(''); setEmail(''); setPassword(''); setRole('user');
            loadUsers();
        } catch (error: any) {
            alert('Erro ao atualizar usuário: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            await adminService.deleteUser(userId);
            alert('Usuário excluído com sucesso!');
            loadUsers();
        } catch (error: any) {
            alert('Erro ao excluir usuário: ' + error.message);
        }
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingUser(null);
        setName('');
        setUsername('');
        setEmail('');
        setPassword('');
        setRole('user');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1a222d] rounded-2xl w-full max-w-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-[#111418] dark:text-white">Gerenciar Usuários</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {(isAdding || editingUser) ? (
                    <div className="space-y-4">
                        <h4 className="font-bold text-primary">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input placeholder="Nome Completo" className="form-input h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none text-[#111418] dark:text-white" value={name} onChange={e => setName(e.target.value)} />
                            <input placeholder="Usuário (Login)" className="form-input h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none text-[#111418] dark:text-white" value={username} onChange={e => setUsername(e.target.value)} />
                            <input placeholder="E-mail" type="email" className="form-input h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none text-[#111418] dark:text-white" value={email} onChange={e => setEmail(e.target.value)} />
                            <input placeholder={editingUser ? "Nova Senha (deixe vazio para manter)" : "Senha"} type="password" className="form-input h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none text-[#111418] dark:text-white" value={password} onChange={e => setPassword(e.target.value)} />
                            <select className="form-select h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none text-[#111418] dark:text-white" value={role} onChange={e => setRole(e.target.value as any)}>
                                <option value="user">Usuário Padrão</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={resetForm} className="flex-1 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 font-bold text-gray-700 dark:text-gray-300">Cancelar</button>
                            <button onClick={editingUser ? handleUpdateUser : handleCreateUser} disabled={submitting} className="flex-1 h-12 rounded-xl bg-primary text-white font-bold disabled:opacity-50">
                                {submitting ? (editingUser ? 'Atualizando...' : 'Criando...') : (editingUser ? 'Atualizar Usuário' : 'Criar Usuário')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <button onClick={() => setIsAdding(true)} className="w-full h-12 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors mb-4 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">add</span>
                            Adicionar Novo Usuário
                        </button>

                        <div className="space-y-3">
                            {loading ? <p className="text-center text-gray-500">Carregando...</p> : users.map(u => (
                                <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <div className="flex-1">
                                        <p className="font-bold text-[#111418] dark:text-white">{u.name}</p>
                                        <p className="text-sm text-gray-500">@{u.username} • {u.email}</p>
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded">
                                            {u.role === 'admin' ? 'Administrador' : 'Usuário'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditUser(u)}
                                            className="size-10 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                            title="Editar usuário"
                                        >
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(u.id, u.name)}
                                            className="size-10 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                            title="Excluir usuário"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
