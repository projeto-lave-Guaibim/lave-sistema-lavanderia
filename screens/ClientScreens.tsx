import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Client } from '../types';
import Header from '../components/Header';
import { openWhatsApp } from '../utils/whatsappUtils';
import { clientService } from '../services/clientService';

export const ClientsListScreen: React.FC = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | undefined>(undefined);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const data = await clientService.getAll();
            setClients(data);
        } catch (error: any) {
            console.error("Failed to fetch clients", error);
            setError(error.message || "Erro ao carregar clientes");
        } finally {
            setLoading(false);
        }
    };

    const handleClientClick = (client: Client) => {
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedClient(undefined);
        setIsModalOpen(true);
    };

    const filteredClients = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
    );

    return (
        <>
            <Header 
                title="Clientes" 
                onMenuClick={toggleSidebar}
                showSearch
                onSearch={setSearchTerm}
                rightActions={
                    <button className="flex items-center justify-center rounded-full size-10 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span className="material-symbols-outlined text-[#111418] dark:text-white">filter_list</span></button>
                }
            />
            <main className="flex-1 overflow-y-auto no-scrollbar bg-background-light dark:bg-background-dark p-4 pb-24">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                        <span className="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
                        <p className="text-gray-900 dark:text-white font-bold">Erro de Conexão</p>
                        <p className="text-gray-500 text-sm mt-1">{error}</p>
                        <button onClick={() => window.location.reload()} className="mt-4 text-primary font-bold text-sm hover:underline">Tentar novamente</button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredClients.map(client => (
                            <div key={client.id} onClick={() => handleClientClick(client)} className="flex items-center gap-4 bg-surface-light dark:bg-surface-dark px-4 py-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:scale-[0.99]">
                                <div className="flex flex-col justify-center flex-1 min-w-0">
                                    <p className="text-[#111418] dark:text-white text-base font-bold leading-normal line-clamp-1">{client.name}</p>
                                    <p className="text-[#637288] dark:text-gray-400 text-sm font-medium leading-normal line-clamp-1">{client.phone}</p>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openWhatsApp(client.phone);
                                    }}
                                    className="shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">call</span>
                                </button>
                            </div>
                        ))}
                        {filteredClients.length === 0 && !loading && (
                            <div className="text-center text-gray-500 mt-10">Nenhum cliente encontrado.</div>
                        )}
                    </div>
                )}
            </main>
            <button onClick={handleAddNew} className="fixed bottom-[90px] right-4 bg-primary hover:bg-primary-dark text-white rounded-full size-14 shadow-lg shadow-blue-500/40 flex items-center justify-center transition-all transform hover:scale-105 z-20"><span className="material-symbols-outlined">add</span></button>
            
            {isModalOpen && (
                <ClientModal 
                    client={selectedClient}
                    onClose={() => setIsModalOpen(false)} 
                    onSuccess={() => { setIsModalOpen(false); fetchClients(); }} 
                />
            )}
        </>
    );
};

const ClientModal: React.FC<{ client?: Client, onClose: () => void, onSuccess: () => void }> = ({ client, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: client?.name || '',
        phone: client?.phone || '',
        type: client?.type || 'Pessoa Física',
        email: client?.email || '',
        document: client?.document || '',
        notes: client?.notes || '',
        tags: client?.tags || [] as string[]
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!formData.name) return alert("Nome é obrigatório");
        setSubmitting(true);
        try {
            if (client) {
                await clientService.update({
                    ...client,
                    ...formData
                });
            } else {
                await clientService.create({
                    ...formData,
                    memberSince: new Date().getFullYear().toString(),
                    avatarUrl: ''
                } as any);
            }
            onSuccess();
        } catch (error: any) {
            console.error("Failed to save client", error);
            alert(`Erro ao salvar cliente: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#1a222d] w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-[#111418] dark:text-white">{client ? 'Editar Cliente' : 'Adicionar Cliente'}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Preencha os dados do cliente para manter seu cadastro atualizado.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full p-1"><span className="material-symbols-outlined text-xl">close</span></button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nome completo / Razão social</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary" placeholder="Digite o nome do cliente" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tipo de cliente</label>
                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary">
                            <option value="Pessoa Física">Pessoa Física</option>
                            <option value="Pessoa Jurídica">Pessoa Jurídica</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                            <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary" placeholder="(00) 00000-0000" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary" placeholder="email@cliente.com" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{formData.type === 'Pessoa Jurídica' ? 'CNPJ' : 'CPF'}</label>
                        <input type="text" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary" placeholder={formData.type === 'Pessoa Jurídica' ? '00.000.000/0000-00' : '000.000.000-00'} />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                        <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary min-h-[100px]" placeholder="Preferências de entrega, instruções adicionais..."></textarea>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-between gap-3 bg-gray-50 dark:bg-gray-900/50">
                    {client && (
                        <button 
                            onClick={async () => {
                                if (confirm('Tem certeza que deseja excluir este cliente?')) {
                                    setSubmitting(true);
                                    try {
                                        await clientService.delete(client.id);
                                        onSuccess();
                                    } catch (error: any) {
                                        alert('Erro ao excluir: ' + error.message);
                                        setSubmitting(false);
                                    }
                                }
                            }}
                            disabled={submitting}
                            className="px-6 py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors"
                        >
                            Excluir
                        </button>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <button onClick={onClose} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
                        <button onClick={handleSubmit} disabled={submitting} className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-50">
                            {submitting ? 'Salvando...' : (client ? 'Salvar Alterações' : 'Cadastrar cliente')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
