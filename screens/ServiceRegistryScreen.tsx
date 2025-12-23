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
        name: '',
        type: 'kg',
        price: 0,
        description: '',
        icon: 'local_laundry_service'
    });

    useEffect(() => {
        fetchServices();
    }, []);

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
            setFormData({
                name: '',
                type: 'kg',
                price: 0,
                description: '',
                icon: 'local_laundry_service'
            });
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
                title="Serviços" 
                onMenuClick={toggleSidebar}
                rightActions={
                    <button onClick={() => handleOpenModal()} className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"><span className="material-symbols-outlined text-2xl">add</span></button>
                }
            />
            <main className="flex-1 overflow-y-auto pb-24 no-scrollbar bg-background-light dark:bg-background-dark p-4">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                    </div>
                ) : services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
                            <span className="material-symbols-outlined text-gray-400 text-4xl">dry_cleaning</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-1">Nenhum serviço encontrado</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">Cadastre os serviços que sua lavanderia oferece (ex: Lavar, Passar).</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {services.map(service => (
                            <div key={service.id} onClick={() => handleOpenModal(service)} className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">{service.icon || 'local_laundry_service'}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#111418] dark:text-white">{service.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{service.type === 'kg' ? 'Por Kg' : 'Por Peça'} • R$ {(service.price || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1a222d] w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[#111418] dark:text-white">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Serviço</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary" placeholder="Ex: Lavar e Secar" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Cobrança</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setFormData({...formData, type: 'kg'})} className={`py-3 rounded-lg border font-medium transition-colors ${formData.type === 'kg' ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>Por Kg</button>
                                    <button onClick={() => setFormData({...formData, type: 'item'})} className={`py-3 rounded-lg border font-medium transition-colors ${formData.type === 'item' ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>Por Peça</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço Base (R$)</label>
                                <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary" placeholder="0.00" />
                            </div>
                            <div className="flex gap-3">
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
                                        className="flex-1 bg-red-50 text-red-600 font-bold py-3.5 rounded-xl hover:bg-red-100 transition-colors"
                                    >
                                        Excluir
                                    </button>
                                )}
                                <button onClick={handleSubmit} className="flex-[2] bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25">Salvar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
