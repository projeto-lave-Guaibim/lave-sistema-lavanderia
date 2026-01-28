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
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | undefined>(undefined);
    const [filterType, setFilterType] = useState<string>('all');
    const [showHidden, setShowHidden] = useState(false);

    useEffect(() => {
        fetchClients();
    }, [showHidden]);

    const fetchClients = async () => {
        try {
            const data = await clientService.getAll(showHidden);
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
        setShowModal(true);
    };

    const handleAddNew = () => {
        setSelectedClient(undefined);
        setShowModal(true);
    };

    useEffect(() => {
        // Apply filters
        let filtered = clients;
        
        if (searchTerm) {
            filtered = filtered.filter(client => 
                client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (client.phone && client.phone.includes(searchTerm))
            );
        }
        
        if (filterType !== 'all') {
            filtered = filtered.filter(client => client.type === filterType);
        }
        
        setFilteredClients(filtered);
    }, [clients, searchTerm, filterType]);

    return (
        <>
            <Header 
                title="Clientes" 
                onMenuClick={toggleSidebar}
                showSearch
                onSearch={setSearchTerm}

            />
            <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar items-center bg-white dark:bg-[#111821] shadow-sm z-10 border-b border-gray-100 dark:border-gray-800">
                {[
                    { label: 'Todos', value: 'all' },
                    { label: 'Pessoa Física', value: 'Pessoa Física' },
                    { label: 'Empresa', value: 'Pessoa Jurídica' },
                    { label: 'Turista', value: 'Turista' }
                ].map(filter => (
                    <button 
                        key={filter.value} 
                        onClick={() => setFilterType(filter.value)} 
                        className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-colors ${filterType === filter.value ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[#111418] dark:text-gray-300'}`}
                    >
                        <p className="text-sm font-medium leading-normal">{filter.label}</p>
                    </button>
                ))}
                <button 
                    onClick={() => setShowHidden(!showHidden)} 
                    className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-colors ${showHidden ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[#111418] dark:text-gray-300'}`}
                    title={showHidden ? 'Ocultar clientes arquivados' : 'Mostrar clientes arquivados'}
                >
                    <span className="material-symbols-outlined text-sm">{showHidden ? 'visibility_off' : 'visibility'}</span>
                    <p className="text-sm font-medium leading-normal">{showHidden ? 'Ocultar Arquivados' : 'Mostrar Arquivados'}</p>
                </button>
            </div>

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
                    <div className="flex flex-col bg-white dark:bg-[#1a222d] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                        {filteredClients.map((client, index) => (
                            <div key={client.id} onClick={() => handleClientClick(client)} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${index !== filteredClients.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                                <div className="flex flex-col justify-center flex-1 min-w-0">
                                    <p className="text-[#111418] dark:text-white text-sm font-semibold leading-tight line-clamp-1">{client.name}</p>
                                    <p className="text-[#637288] dark:text-gray-400 text-xs font-normal leading-normal line-clamp-1">{client.phone}</p>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openWhatsApp(client.phone);
                                    }}
                                    className="shrink-0 h-8 w-8 flex items-center justify-center rounded-full text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                    title="WhatsApp"
                                >
                                    <span className="material-symbols-outlined text-[18px]">call</span>
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
            
            {showModal && (
                <ClientModal 
                    client={selectedClient}
                    onClose={() => setShowModal(false)} 
                    onSuccess={() => { setShowModal(false); fetchClients(); }} 
                />
            )}
        </>
    );
};

export const ClientModal: React.FC<{ client?: Client, onClose: () => void, onSuccess: () => void }> = ({ client, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: client?.name || '',
        phone: client?.phone || '',
        type: client?.type || 'Pessoa Física',
        email: client?.email || '',
        document: client?.document || '',
        notes: client?.notes || '',
        tags: client?.tags || [] as string[],
        zipCode: client?.zipCode || '',
        street: client?.street || '',
        number: client?.number || '',
        neighborhood: client?.neighborhood || '',
        cityCode: client?.cityCode || '2932603', // Default Valença-BA
        state: client?.state || 'BA'
    });
    const [submitting, setSubmitting] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);

    const handleCepBlur = async () => {
        const cep = formData.zipCode.replace(/\D/g, '');
        if (cep.length === 8) {
            setLoadingCep(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        street: data.logradouro,
                        neighborhood: data.bairro,
                        state: data.uf,
                        cityCode: data.ibge
                    }));
                }
            } catch (error) {
                console.error("Erro ao buscar CEP", error);
            } finally {
                setLoadingCep(false);
            }
        }
    };

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
                        <p className="text-sm text-gray-500 dark:text-gray-400">Preencha os dados completos para emissão de Nota Fiscal.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full p-1"><span className="material-symbols-outlined text-xl">close</span></button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* Basic Info */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nome completo / Razão social</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary" placeholder="Digite o nome do cliente" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary">
                                <option value="Pessoa Física">Pessoa Física</option>
                                <option value="Pessoa Jurídica">Pessoa Jurídica</option>
                                <option value="Turista">Turista</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{formData.type === 'Pessoa Jurídica' ? 'CNPJ' : 'CPF'}</label>
                            <input type="text" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary" placeholder="Somente números" />
                        </div>
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

                    {/* Address Section */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Endereço (Obrigatório p/ NF)</p>
                        
                        <div className="grid grid-cols-3 gap-4 mb-3">
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">CEP</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={formData.zipCode} 
                                        onChange={e => setFormData({...formData, zipCode: e.target.value})} 
                                        onBlur={handleCepBlur}
                                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary" 
                                        placeholder="00000-000" 
                                    />
                                    {loadingCep && <span className="absolute right-3 top-3 material-symbols-outlined animate-spin text-primary text-sm">progress_activity</span>}
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Rua / Logradouro</label>
                                <input type="text" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Número</label>
                                <input type="text" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Bairro</label>
                                <input type="text" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                                <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 text-sm">
                                    {formData.cityCode === '2932603' ? 'Valença' : 'Outra'} (Cód: {formData.cityCode})
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">UF</label>
                                <input type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                        <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary min-h-[60px]" placeholder="Preferências de entrega..."></textarea>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex flex-wrap gap-3">
                        {client && (
                            <>
                                <button 
                                    onClick={async () => {
                                        const action = client.isHidden ? 'reexibir' : 'ocultar';
                                        if (confirm(`Tem certeza que deseja ${action} este cliente?`)) {
                                            setSubmitting(true);
                                            try {
                                                if (client.isHidden) {
                                                    await clientService.unhide(client.id);
                                                } else {
                                                    await clientService.hide(client.id);
                                                }
                                                onSuccess();
                                            } catch (error: any) {
                                                alert(`Erro ao ${action}: ` + error.message);
                                                setSubmitting(false);
                                            }
                                        }
                                    }}
                                    disabled={submitting}
                                    className="flex-1 min-w-[120px] px-4 py-3 rounded-xl border border-orange-200 text-orange-600 font-bold hover:bg-orange-50 transition-colors"
                                >
                                    {client.isHidden ? 'Reexibir' : 'Ocultar'}
                                </button>
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
                                    className="flex-1 min-w-[120px] px-4 py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors"
                                >
                                    Excluir
                                </button>
                            </>
                        )}
                        <button 
                            onClick={onClose} 
                            className="flex-1 min-w-[120px] px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSubmit} 
                            disabled={submitting} 
                            className="flex-1 min-w-[140px] px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {submitting ? 'Salvando...' : (client ? 'Salvar' : 'Cadastrar')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
