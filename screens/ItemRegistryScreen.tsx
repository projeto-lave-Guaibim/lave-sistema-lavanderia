import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { CatalogItem } from '../types';
import Header from '../components/Header';
import { catalogService } from '../services/catalogService';

export const ItemRegistryScreen: React.FC = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
    const [formData, setFormData] = useState<Partial<CatalogItem>>({
        name: '',
        category: 'Roupas',
        price: 0,
        icon: 'checkroom'
    });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const data = await catalogService.getItems();
            setItems(data);
        } catch (error) {
            console.error("Failed to fetch items", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item?: CatalogItem) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                category: 'Roupas',
                price: 0,
                icon: 'checkroom'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingItem) {
                await catalogService.updateItem({ ...editingItem, ...formData } as CatalogItem);
            } else {
                await catalogService.createItem(formData as CatalogItem);
            }
            setIsModalOpen(false);
            fetchItems();
        } catch (error) {
            console.error("Failed to save item", error);
            alert("Erro ao salvar peça.");
        }
    };

    return (
        <>
            <Header 
                title="Catálogo de Peças" 
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
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
                            <span className="material-symbols-outlined text-gray-400 text-4xl">checkroom</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-1">Nenhuma peça encontrada</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">Cadastre as peças de roupa para facilitar os pedidos (ex: Camisa, Calça).</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {items.map(item => (
                            <div key={item.id} onClick={() => handleOpenModal(item)} className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                        <span className="material-symbols-outlined">{item.icon || 'checkroom'}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#111418] dark:text-white">{item.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.category} • R$ {item.price.toFixed(2)}</p>
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
                            <h3 className="text-lg font-bold text-[#111418] dark:text-white">{editingItem ? 'Editar Peça' : 'Nova Peça'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Peça</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary" placeholder="Ex: Camisa Social" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary">
                                    <option>Roupas</option>
                                    <option>Cama, Mesa e Banho</option>
                                    <option>Tapetes e Cortinas</option>
                                    <option>Outros</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço Unitário (R$)</label>
                                <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-[#111418] dark:text-white focus:ring-primary focus:border-primary" placeholder="0.00" />
                            </div>
                            <div className="flex gap-3">
                                {editingItem && (
                                    <button 
                                        onClick={async () => {
                                            if (confirm('Excluir esta peça?')) {
                                                try {
                                                    await catalogService.deleteItem(editingItem.id);
                                                    setIsModalOpen(false);
                                                    fetchItems();
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
