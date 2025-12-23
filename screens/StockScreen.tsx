import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { StockItem } from '../types';
import Header from '../components/Header';
import { stockService } from '../services/stockService';
import { financeService } from '../services/financeService';
import { TransactionType } from '../types';

export const StockControlScreen: React.FC = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStock = async () => {
            try {
                const data = await stockService.getAll();
                setStockItems(data);
            } catch (error) {
                console.error("Failed to fetch stock", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStock();
    }, []);

    const totalItems = stockItems.reduce((acc, item) => acc + item.quantity, 0);
    const itemsToRestock = stockItems.filter(item => item.quantity <= item.minQuantity).length;
    
    const getStatus = (item: StockItem) => {
        if (item.quantity === 0) return {
            borderColor: 'border-red-200 dark:border-red-900',
            barColor: 'bg-red-500',
            bgColor: 'bg-red-50 dark:bg-red-900/10',
            borderInside: 'border-red-100 dark:border-red-900/30',
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            iconColor: 'text-red-600 dark:text-red-400',
            qtyColor: 'text-red-700 dark:text-red-300',
            qtyLabelColor: 'text-red-600 dark:text-red-400',
            messageIcon: 'block',
            message: 'Estoque Esgotado'
        };
        if (item.quantity <= item.minQuantity) return {
            borderColor: 'border-red-200 dark:border-red-900',
            barColor: 'bg-red-500',
            bgColor: 'bg-red-50 dark:bg-red-900/10',
            borderInside: 'border-red-100 dark:border-red-900/30',
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            iconColor: 'text-red-600 dark:text-red-400',
            qtyColor: 'text-red-700 dark:text-red-300',
            qtyLabelColor: 'text-red-600 dark:text-red-400',
            messageIcon: 'error',
            message: 'Estoque abaixo do mínimo'
        };
        return {
            borderColor: 'border-gray-200 dark:border-gray-800',
            barColor: 'bg-primary',
            bgColor: 'bg-gray-50 dark:bg-gray-800/50',
            borderInside: '',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-primary',
            qtyColor: 'text-[#111418] dark:text-white',
            qtyLabelColor: 'text-gray-500',
            message: null,
            messageIcon: null,
        };
    };

    const getIconForItem = (name: string) => {
        if(name.toLowerCase().includes('sabão')) return 'local_laundry_service';
        if(name.toLowerCase().includes('amaciante')) return 'water_drop';
        if(name.toLowerCase().includes('alvejante')) return 'sanitizer';
        if(name.toLowerCase().includes('sacolas')) return 'shopping_bag';
        return 'inventory';
    }
    
    return (
        <>
            <Header 
                title="Controle de Estoque" 
                onMenuClick={toggleSidebar}
                rightActions={
                    <button onClick={() => navigate('/stock/new')} className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"><span className="material-symbols-outlined text-2xl">add</span></button>
                }
            />
            <main className="flex-1 overflow-y-auto pb-28 no-scrollbar bg-background-light dark:bg-background-dark">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3 p-4">
                            <div className="flex flex-col p-4 bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800"><span className="text-sm text-gray-500 font-medium">Total de Itens</span><span className="text-2xl font-bold text-[#111418] dark:text-white mt-1">{totalItems}</span></div>
                            <div className="flex flex-col p-4 bg-red-50 dark:bg-red-900/10 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30">
                                <span className="text-sm text-red-600 dark:text-red-400 font-bold">Repor Estoque</span>
                                <div className="flex items-center gap-2 mt-1"><span className="text-2xl font-bold text-red-700 dark:text-red-400">{itemsToRestock}</span><span className="material-symbols-outlined text-red-500 text-lg">warning</span></div>
                            </div>
                        </div>
                        <div className="px-4 pb-2">
                            <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="material-symbols-outlined text-gray-400 text-[20px]">search</span></div><input className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark text-sm pl-10 pr-4 focus:ring-primary focus:border-primary transition-shadow placeholder:text-gray-400" placeholder="Buscar produto..." type="text" /></div>
                        </div>
                        <div className="pt-4 px-4 flex flex-col gap-4">
                            {stockItems.map(item => {
                                const status = getStatus(item);
                                return (
                                    <div key={item.id} className={`group relative flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl border ${status.borderColor} shadow-sm overflow-hidden active:scale-[0.99] transition-transform`}>
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${status.barColor}`}></div>
                                        <div className="p-4 pl-5">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-10 rounded-lg ${status.iconBg} flex items-center justify-center ${status.iconColor}`}><span className="material-symbols-outlined">{getIconForItem(item.name)}</span></div>
                                                    <div><h4 className="font-bold text-[#111418] dark:text-white text-lg leading-tight">{item.name}</h4><p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-0.5">{item.category} / {item.volume}</p></div>
                                                </div>
                                                <button onClick={() => navigate(`/stock/edit/${item.id}`)} className="size-8 flex items-center justify-center text-gray-400 hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                                            </div>
                                            <div className={`mt-4 flex items-end justify-between ${status.bgColor} rounded-lg p-3 border ${status.borderInside}`}>
                                                <div><p className={`text-[10px] font-bold ${status.qtyLabelColor} uppercase tracking-wider mb-1`}>Quantidade Atual</p><p className={`text-2xl font-bold ${status.qtyColor}`}>{item.quantity} <span className="text-sm font-medium opacity-70">un</span></p></div>
                                                <div className="text-right"><p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Mínimo</p><p className="text-base font-bold text-gray-700 dark:text-gray-300">{item.minQuantity} <span className="text-xs font-medium opacity-70">un</span></p></div>
                                            </div>
                                            {status.message && (
                                                <div className="mt-2 flex items-center gap-1.5"><span className="material-symbols-outlined text-red-500 text-sm">{status.messageIcon}</span><span className="text-xs font-bold text-red-600 dark:text-red-400">{status.message}</span></div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>
        </>
    );
};

export const AddStockItemScreen: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        category: 'Lavagem',
        volume: '',
        quantity: '',
        minQuantity: '',
        cost: '' // New field for cost
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.quantity || !formData.cost) {
            alert("Por favor, preencha o nome, quantidade e valor.");
            return;
        }

        setSubmitting(true);
        try {
            // 1. Create Stock Item
            await stockService.create({
                ...formData,
                quantity: parseInt(formData.quantity),
                minQuantity: parseInt(formData.minQuantity) || 0
            });

            // 2. Create Expense Transaction
            await financeService.create({
                type: TransactionType.Despesa,
                description: `Compra de ${formData.name}`,
                clientName: 'Fornecedor', // Generic name or add input if needed
                date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
                amount: parseFloat(formData.cost),
                paid: true,
                icon: 'shopping_cart'
            });

            navigate('/stock');
        } catch (error) {
            console.error("Failed to create stock item", error);
            alert("Erro ao salvar item.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-10 flex items-center bg-surface-light dark:bg-surface-dark px-4 py-3 shadow-sm justify-between border-b border-gray-100 dark:border-gray-800">
                <button onClick={() => navigate(-1)} className="text-primary hover:text-blue-600 active:scale-95 transition-transform flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-50 dark:hover:bg-gray-800"><span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span></button>
                <h1 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] text-center">Adicionar Insumo</h1>
                <div className="size-10"></div>
            </header>
            <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 pb-24">
                <div className="max-w-2xl mx-auto space-y-6">
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 px-1"><span className="material-symbols-outlined text-primary text-[20px]">inventory</span><h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">Dados do Insumo</h3></div>
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                            <InputField label="Nome do Insumo" placeholder="Ex: Sabão Líquido Omo" name="name" value={formData.name} onChange={handleChange} />
                            <div className="relative">
                                <label className="text-gray-700 dark:text-gray-300 text-sm font-medium leading-normal pb-2 block">Categoria</label>
                                <select name="category" value={formData.category} onChange={handleChange} className="form-select w-full rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-primary focus:ring-1 focus:ring-primary/20 h-12 px-4 text-base transition-all appearance-none">
                                    <option>Lavagem</option>
                                    <option>Finalização</option>
                                    <option>Tira Manchas</option>
                                    <option>Embalagem</option>
                                    <option>Outros</option>
                                </select>
                                <div className="absolute right-3 top-10 pointer-events-none text-gray-400"><span className="material-symbols-outlined">expand_more</span></div>
                            </div>
                        </div>
                    </section>
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 px-1"><span className="material-symbols-outlined text-primary text-[20px]">rule</span><h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">Controle de Estoque</h3></div>
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField label="Volume / Unidade" placeholder="Ex: 5 Litros" name="volume" value={formData.volume} onChange={handleChange} />
                                <InputField label="Quantidade Atual" placeholder="0" type="number" name="quantity" value={formData.quantity} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField label="Quantidade Mínima" placeholder="0" type="number" name="minQuantity" value={formData.minQuantity} onChange={handleChange} />
                                <InputField label="Valor Total (R$)" placeholder="0,00" type="number" name="cost" value={formData.cost} onChange={handleChange} />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 px-1">O valor será lançado automaticamente como despesa no financeiro.</p>
                        </div>
                    </section>
                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button onClick={() => navigate(-1)} className="h-12 px-6 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                        <button onClick={handleSubmit} disabled={submitting} className="h-12 px-8 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark shadow-md shadow-primary/20 transition-all">
                            {submitting ? 'Salvando...' : 'Salvar Insumo'}
                        </button>
                    </div>
                </div>
            </main>
        </>
    );
};

export const EditStockItemScreen: React.FC = () => {
    const navigate = useNavigate();
    const { itemId } = useParams();
    const [item, setItem] = useState<StockItem | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const items = await stockService.getAll();
                const found = items.find(i => i.id.toString() === itemId);
                setItem(found);
            } catch (error) {
                console.error("Failed to fetch item", error);
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [itemId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (item) {
            setItem({ ...item, [name]: value });
        }
    };
    
    if (loading) return <div className="flex justify-center items-center h-full"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;
    if (!item) return <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">Insumo não encontrado.</p></div>;

    return (
        <>
            <header className="sticky top-0 z-10 flex items-center bg-surface-light dark:bg-surface-dark px-4 py-3 shadow-sm justify-between border-b border-gray-100 dark:border-gray-800">
                <button onClick={() => navigate(-1)} className="text-primary hover:text-blue-600 active:scale-95 transition-transform flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-50 dark:hover:bg-gray-800"><span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span></button>
                <h1 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] text-center">Editar Insumo</h1>
                <div className="size-10"></div>
            </header>
            <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 pb-24">
                <div className="max-w-2xl mx-auto space-y-6">
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 px-1"><span className="material-symbols-outlined text-primary text-[20px]">inventory</span><h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">Dados do Insumo</h3></div>
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                            <InputField label="Nome do Insumo" placeholder="Ex: Sabão Líquido Omo" name="name" value={item.name} onChange={handleInputChange}/>
                            <div className="relative">
                                <label className="text-gray-700 dark:text-gray-300 text-sm font-medium leading-normal pb-2 block">Categoria</label>
                                <select name="category" value={item.category} onChange={handleInputChange} className="form-select w-full rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-primary focus:ring-1 focus:ring-primary/20 h-12 px-4 text-base transition-all appearance-none">
                                    <option>Lavagem</option>
                                    <option>Finalização</option>
                                    <option>Tira Manchas</option>
                                    <option>Embalagem</option>
                                    <option>Outros</option>
                                </select>
                                <div className="absolute right-3 top-10 pointer-events-none text-gray-400"><span className="material-symbols-outlined">expand_more</span></div>
                            </div>
                        </div>
                    </section>
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 px-1"><span className="material-symbols-outlined text-primary text-[20px]">rule</span><h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight">Controle de Estoque</h3></div>
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField label="Volume / Unidade" placeholder="Ex: 5 Litros" name="volume" value={item.volume} onChange={handleInputChange} />
                                <InputField label="Quantidade Atual" placeholder="0" type="number" name="quantity" value={item.quantity} onChange={handleInputChange}/>
                            </div>
                            <div>
                                <InputField label="Quantidade Mínima para Alerta" placeholder="0" type="number" name="minQuantity" value={item.minQuantity} onChange={handleInputChange}/>
                                <p className="text-xs text-gray-500 mt-2 px-1">Você receberá uma notificação quando o estoque atingir essa quantidade.</p>
                            </div>
                        </div>
                    </section>
                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button onClick={() => navigate(-1)} className="h-12 px-6 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                        <button onClick={() => navigate('/stock')} className="h-12 px-8 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark shadow-md shadow-primary/20 transition-all">Salvar Alterações</button>
                    </div>
                </div>
            </main>
        </>
    );
};

const InputField: React.FC<{label: string, placeholder: string, type?: string, value?: string | number, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void, name?: string}> = ({ label, placeholder, type = 'text', value, onChange, name }) => (
    <label className="flex flex-col w-full">
        <p className="text-gray-700 dark:text-gray-300 text-sm font-medium leading-normal pb-2">{label}</p>
        <input name={name} className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-primary focus:ring-1 focus:ring-primary/20 h-12 px-4 text-base transition-all" placeholder={placeholder} type={type} value={value} onChange={onChange}/>
    </label>
);