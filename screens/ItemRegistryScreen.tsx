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
        name: '', category: 'Roupas', price: 0, icon: 'checkroom'
    });

    useEffect(() => { fetchItems(); }, []);

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
            setFormData({ name: '', category: 'Roupas', price: 0, icon: 'checkroom' });
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
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-1 h-7 px-2.5 rounded bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
                    >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        Nova
                    </button>
                }
            />

            <main className="flex-1 overflow-y-auto pb-24 no-scrollbar p-3 bg-[#eef0f3] dark:bg-[#111821]">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                        <span className="material-symbols-outlined text-gray-300 text-5xl mb-2">checkroom</span>
                        <h3 className="text-sm font-bold text-gray-600 dark:text-white mb-1">Nenhuma peça cadastrada</h3>
                        <p className="text-gray-400 dark:text-gray-500 text-xs max-w-xs">Cadastre as peças para facilitar os pedidos (ex: Camisa, Calça).</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                        {items.map((item, idx) => (
                            <div
                                key={item.id}
                                onClick={() => handleOpenModal(item)}
                                className={`flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors ${idx > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                                        <span className="material-symbols-outlined text-[16px]">{item.icon || 'checkroom'}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{item.name}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                            {item.category} &bull; R$ {item.price.toFixed(2)}
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
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e2a38]">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                                {editingItem ? 'Editar Peça' : 'Nova Peça'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Nome da Peça</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full h-8 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2.5 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary"
                                    placeholder="Ex: Camisa Social"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Categoria</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                    className="w-full h-8 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2.5 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary"
                                >
                                    <option>Roupas</option>
                                    <option>Cama, Mesa e Banho</option>
                                    <option>Tapetes e Cortinas</option>
                                    <option>Outros</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Preço Unitário (R$)</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                                    className="w-full h-8 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2.5 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 px-4 pb-4">
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
                                    className="flex-1 h-8 bg-red-50 text-red-600 font-bold text-xs rounded border border-red-200 hover:bg-red-100 transition-colors"
                                >
                                    Excluir
                                </button>
                            )}
                            <button onClick={handleSubmit} className="flex-[2] h-8 bg-primary text-white font-bold text-xs rounded hover:bg-primary-dark transition-colors">
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
