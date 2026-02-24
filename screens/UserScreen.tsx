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

    const menuItem = (icon: string, label: string, onClick: () => void, color = 'text-gray-500') => (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-100 dark:border-gray-800 last:border-0"
        >
            <div className="flex items-center gap-2.5">
                <span className={`material-symbols-outlined text-[18px] ${color}`}>{icon}</span>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{label}</span>
            </div>
            <span className="material-symbols-outlined text-gray-300 text-[16px]">chevron_right</span>
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-[#eef0f3] dark:bg-[#111821]">
            <Header title="Meu Perfil" />
            
            <main className="flex-1 overflow-y-auto p-3 pb-24 space-y-3">
                {/* User card */}
                <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.name}</p>
                            <p className="text-[10px] text-gray-500">@{user?.username} {user?.email ? `• ${user.email}` : ''}</p>
                        </div>
                        <span className="ml-auto px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded">
                            {user?.role === 'admin' ? 'Admin' : 'Usuário'}
                        </span>
                    </div>
                </div>

                {/* Admin section */}
                {user?.role === 'admin' && (
                    <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                        <div className="px-3 py-1.5 bg-gray-50 dark:bg-[#1e2a38] border-b border-gray-200 dark:border-gray-700">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Administração</span>
                        </div>
                        {menuItem('group_add', 'Gerenciar Usuários', () => setIsManageUsersOpen(true), 'text-primary')}
                    </div>
                )}

                {/* Settings section */}
                <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                    <div className="px-3 py-1.5 bg-gray-50 dark:bg-[#1e2a38] border-b border-gray-200 dark:border-gray-700">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Configurações</span>
                    </div>
                    {menuItem('lock', 'Alterar Senha', () => setIsChangePasswordOpen(true))}
                    {menuItem('notifications', 'Notificações', () => {})}
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 h-9 rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    Sair da Conta
                </button>
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

    const inputClass = "w-full h-8 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary";
    const labelClass = "block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1";

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
            <div className="bg-white dark:bg-[#1a222d] w-full sm:max-w-sm rounded-t-xl sm:rounded border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e2a38]">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">Alterar Senha</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className={labelClass}>Senha Atual</label>
                        <input type="password" className={inputClass} value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass}>Nova Senha</label>
                        <input type="password" className={inputClass} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass}>Confirmar Nova Senha</label>
                        <input type="password" className={inputClass} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                </div>
                <div className="flex gap-2 px-4 pb-4">
                    <button onClick={onClose} className="flex-1 h-8 rounded border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-1 h-8 rounded bg-primary text-white text-xs font-bold hover:bg-primary-dark disabled:opacity-50 transition-colors">
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

    const [name, setName] = React.useState('');
    const [username, setUsername] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [role, setRole] = React.useState<'admin' | 'user'>('user');
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => { loadUsers(); }, []);

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
            resetForm();
            loadUsers();
        } catch (error: any) {
            alert('Erro ao criar usuário: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditUser = (u: any) => {
        setEditingUser(u);
        setName(u.name); setUsername(u.username); setEmail(u.email); setRole(u.role); setPassword('');
    };

    const handleUpdateUser = async () => {
        if (!name || !username || !email) return alert('Preencha todos os campos obrigatórios');
        setSubmitting(true);
        try {
            await adminService.updateUser(editingUser.id, { name, username, email, role });
            if (password) await adminService.resetPassword(editingUser.id, password);
            alert('Usuário atualizado com sucesso!');
            resetForm();
            loadUsers();
        } catch (error: any) {
            alert('Erro ao atualizar usuário: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) return;
        try {
            await adminService.deleteUser(userId);
            alert('Usuário excluído com sucesso!');
            loadUsers();
        } catch (error: any) {
            alert('Erro ao excluir usuário: ' + error.message);
        }
    };

    const resetForm = () => {
        setIsAdding(false); setEditingUser(null);
        setName(''); setUsername(''); setEmail(''); setPassword(''); setRole('user');
    };

    const inputClass = "w-full h-8 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-[#1a222d] w-full max-w-2xl rounded border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e2a38] shrink-0">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">Gerenciar Usuários</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {(isAdding || editingUser) ? (
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-primary">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input placeholder="Nome Completo" className={inputClass} value={name} onChange={e => setName(e.target.value)} />
                                <input placeholder="Usuário (Login)" className={inputClass} value={username} onChange={e => setUsername(e.target.value)} />
                                <input placeholder="E-mail" type="email" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} />
                                <input placeholder={editingUser ? "Nova senha (vazio = manter)" : "Senha"} type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} />
                                <select className={inputClass} value={role} onChange={e => setRole(e.target.value as any)}>
                                    <option value="user">Usuário Padrão</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button onClick={resetForm} className="flex-1 h-8 rounded border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-300">Cancelar</button>
                                <button onClick={editingUser ? handleUpdateUser : handleCreateUser} disabled={submitting} className="flex-[2] h-8 rounded bg-primary text-white text-xs font-bold disabled:opacity-50">
                                    {submitting ? (editingUser ? 'Atualizando...' : 'Criando...') : (editingUser ? 'Atualizar' : 'Criar Usuário')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <button onClick={() => setIsAdding(true)} className="w-full h-8 rounded border border-primary/30 bg-primary/5 text-primary font-bold text-xs hover:bg-primary/10 transition-colors mb-3 flex items-center justify-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">add</span>
                                Adicionar Usuário
                            </button>

                            {/* Users list */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                                {loading ? (
                                    <p className="text-center text-xs text-gray-500 py-6">Carregando...</p>
                                ) : users.map((u, idx) => (
                                    <div key={u.id} className={`flex items-center justify-between px-3 py-2 ${idx > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}`}>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-900 dark:text-white">{u.name}</p>
                                            <p className="text-[10px] text-gray-500">@{u.username} · {u.email}</p>
                                            <span className="inline-block mt-0.5 px-1.5 py-px bg-primary/10 text-primary text-[9px] font-bold rounded">
                                                {u.role === 'admin' ? 'Admin' : 'Usuário'}
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => handleEditUser(u)}
                                                className="w-7 h-7 flex items-center justify-center rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u.id, u.name)}
                                                className="w-7 h-7 flex items-center justify-center rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
