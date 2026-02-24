import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Service } from '../types';
import Header from '../components/Header';
import { catalogService } from '../services/catalogService';

export const ServiceRegistryScreen: React.FC = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [formData, setFormData] = useState<Partial<Service>>({
        name: '', type: 'kg', price: 0, description: '', icon: 'local_laundry_service'
    });

    useEffect(() => { fetchServices(); }, []);

    const fetchServices = async () => {
        try {
            const data = await catalogService.getServices();
            setServices(data);
        } catch (error) {
            console.error("Failed to fetch services", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (service?: Service) => {
        if (service) {
            setEditingService(service);
            setFormData(service);
        } else {
            setEditingService(null);
            setFormData({ name: '', type: 'kg', price: 0, description: '', icon: 'local_laundry_service' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingService) {
                await catalogService.updateService({ ...editingService, ...formData } as Service);
            } else {
                await catalogService.createService(formData as Service);
            }
            setIsModalOpen(false);
            fetchServices();
        } catch (error) {
            console.error("Failed to save service", error);
            alert("Erro ao salvar serviço.");
        }
    };

    return (
        <>
            <Header 
                title="Catálogo de Serviços" 
                onMenuClick={toggleSidebar}
                rightActions={
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-1 h-7 px-2.5 rounded bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
                    >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        Novo
                    </button>
                }
            />

            <main className="flex-1 overflow-y-auto pb-24 no-scrollbar p-3 bg-[#eef0f3] dark:bg-[#111821]">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                    </div>
                ) : services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                        <span className="material-symbols-outlined text-gray-300 text-5xl mb-2">dry_cleaning</span>
                        <h3 className="text-sm font-bold text-gray-600 dark:text-white mb-1">Nenhum serviço cadastrado</h3>
                        <p className="text-gray-400 dark:text-gray-500 text-xs max-w-xs">Cadastre os serviços que sua lavanderia oferece (ex: Lavar, Passar).</p>
                    </div>
                ) : (
                    /* Flat bordered list */
                    <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                        {services.map((service, idx) => (
                            <div
                                key={service.id}
                                onClick={() => handleOpenModal(service)}
                                className={`flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors ${idx > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary shrink-0">
                                        <span className="material-symbols-outlined text-[16px]">{service.icon || 'local_laundry_service'}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{service.name}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                            {service.type === 'kg' ? 'Por Kg' : 'Por Peça'} &bull; R$ {(service.price || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-gray-300 text-[18px]">chevron_right</span>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    <div className="bg-white dark:bg-[#1a222d] w-full sm:max-w-md rounded-t-xl sm:rounded border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e2a38]">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                        {/* Modal body */}
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Nome do Serviço</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full h-8 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2.5 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary"
                                    placeholder="Ex: Lavar e Secar"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Tipo de Cobrança</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setFormData({...formData, type: 'kg'})}
                                        className={`h-8 rounded border text-xs font-bold transition-colors ${formData.type === 'kg' ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                                    >
                                        Por Kg
                                    </button>
                                    <button
                                        onClick={() => setFormData({...formData, type: 'item'})}
                                        className={`h-8 rounded border text-xs font-bold transition-colors ${formData.type === 'item' ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                                    >
                                        Por Peça
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Preço Base (R$)</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                                    className="w-full h-8 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2.5 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        {/* Modal footer */}
                        <div className="flex gap-2 px-4 pb-4">
                            {editingService && (
                                <button 
                                    onClick={async () => {
                                        if (confirm('Excluir este serviço?')) {
                                            try {
                                                await catalogService.deleteService(editingService.id);
                                                setIsModalOpen(false);
                                                fetchServices();
                                            } catch (error: any) {
                                                alert('Erro: ' + error.message);
                                            }
                                        }
                                    }}
                                    className="flex-1 h-8 bg-red-50 text-red-600 font-bold text-xs rounded border border-red-200 hover:bg-red-100 transition-colors"
                                >
                                    Excluir
                                </button>
                            )}
                            <button
                                onClick={handleSubmit}
                                className="flex-[2] h-8 bg-primary text-white font-bold text-xs rounded hover:bg-primary-dark transition-colors"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
