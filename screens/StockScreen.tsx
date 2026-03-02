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
            <main className="flex-1 overflow-y-auto pb-24 no-scrollbar bg-background-light dark:bg-background-dark">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                    </div>
                ) : (
                    <>
                        {/* Summary cards - compact */}
                        <div className="grid grid-cols-2 gap-2 p-3">
                            <div className="flex items-center gap-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a222d] p-2.5">
                                <span className="material-symbols-outlined text-primary text-[18px]">inventory</span>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Total de Itens</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{totalItems}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-2.5">
                                <span className="material-symbols-outlined text-red-500 text-[18px]">warning</span>
                                <div>
                                    <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold uppercase tracking-wide">Repor Estoque</p>
                                    <p className="text-lg font-bold text-red-700 dark:text-red-400">{itemsToRestock}</p>
                                </div>
                            </div>
                        </div>
                        {/* Search compact */}
                        <div className="px-3 pb-2">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-gray-400 text-[16px]">search</span>
                                </div>
                                <input className="w-full h-8 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a222d] text-xs pr-3 focus:ring-primary focus:border-primary transition-shadow placeholder:text-gray-400" style={{ paddingLeft: '36px' }} placeholder="Buscar produto..." type="text" />
                            </div>
                        </div>
                        {/* Stock list */}
                        <div className="px-3 pb-4">
                            <div className="rounded border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-[#1a222d]">
                                {stockItems.map((item, idx) => {
                                const status = getStatus(item);
                                return (
                                    <div key={item.id} className={`flex items-center gap-3 px-3 py-2 ${idx < stockItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}>
                                        <div className={`w-1 self-stretch rounded-full ${status.barColor} shrink-0`}></div>
                                        <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${status.iconBg} ${status.iconColor}`}>
                                            <span className="material-symbols-outlined text-[15px]">{getIconForItem(item.name)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-800 dark:text-white line-clamp-1">{item.name}</p>
                                            <p className="text-[10px] text-gray-400">{item.category} · {item.volume}</p>
                                            {status.message && <p className="text-[9px] font-bold text-red-500 uppercase">{status.message}</p>}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`text-sm font-bold ${status.qtyColor}`}>{item.quantity} <span className="text-[10px] font-normal opacity-70">un</span></p>
                                            <p className="text-[10px] text-gray-400">Mín: {item.minQuantity}</p>
                                        </div>
                                        <button onClick={() => navigate(`/stock/edit/${item.id}`)} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0">
                                            <span className="material-symbols-outlined text-[15px]">edit</span>
                                        </button>
                                    </div>
                                );
                            })}
                            </div>
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
        category: '5.03 Detergente Neutro Concentrado',
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
                icon: 'shopping_cart',
                category: formData.category,
                group: 'G05 - Custos Variáveis Operacionais'
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
            <header className="sticky top-0 z-10 flex items-center bg-white dark:bg-[#1a222d] px-3 justify-between border-b border-gray-200 dark:border-gray-700 h-11">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary hover:text-blue-700 text-xs font-semibold">
                    <span className="material-symbols-outlined text-[16px]">arrow_back_ios_new</span> Voltar
                </button>
                <h1 className="text-gray-900 dark:text-white text-sm font-bold">Adicionar Insumo</h1>
                <div className="w-16"></div>
            </header>
            <main className="flex-1 overflow-y-auto no-scrollbar p-3 pb-24">
                <div className="max-w-2xl mx-auto space-y-4">
                    <section>
                        <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-gray-200 dark:border-gray-700">
                            <span className="material-symbols-outlined text-primary text-[16px]">inventory</span>
                            <h3 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wide">Dados do Insumo</h3>
                        </div>
                        <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded p-3 space-y-3">
                            <InputField label="Nome do Insumo" placeholder="Ex: Sabão Líquido Omo" name="name" value={formData.name} onChange={handleChange} />
                            <div>
                                <label className="normal-case text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block" style={{textTransform:'none', letterSpacing:'normal'}}>Categoria</label>
                                <select name="category" value={formData.category} onChange={handleChange} className="w-full rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white h-8 px-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary/20">
                                    <option>5.01 Energia Elétrica — Consumo Variável</option>
                                    <option>5.02 Água e Saneamento — Consumo Variável</option>
                                    <option>5.03 Detergente Neutro Concentrado</option>
                                    <option>5.04 Alvejante de Oxigênio Ativo (sem cloro)</option>
                                    <option>5.05 Peróxido de Hidrogênio</option>
                                    <option>5.06 Produto Específico para Mofo</option>
                                    <option>5.07 Álcool Isopropílico</option>
                                    <option>5.08 Bicarbonato de Sódio</option>
                                    <option>5.09 Ácido Oxálico</option>
                                    <option>5.10 Sabão em Pó</option>
                                    <option>5.11 Vinagre Branco</option>
                                    <option>5.12 Embalagens — Sacolas e Papel de Embrulho</option>
                                    <option>5.13 Etiquetas e Material de Identificação</option>
                                    <option>5.14 Fita Crepe e Caneta Permanente</option>
                                    <option>5.15 Materiais de Limpeza do Espaço</option>
                                    <option>5.16 Amaciante</option>
                                    <option>5.17 Gás (Secadoras/Aquecimento)</option>
                                    <option>5.18 Combustível e Logística (Entregas)</option>
                                    <option>5.19 Outros Produtos Químicos / Tira-manchas</option>
                                </select>
                            </div>
                        </div>
                    </section>
                    <section>
                        <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-gray-200 dark:border-gray-700">
                            <span className="material-symbols-outlined text-primary text-[16px]">rule</span>
                            <h3 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wide">Controle de Estoque</h3>
                        </div>
                        <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded p-3 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <InputField label="Volume / Unidade" placeholder="Ex: 5 Litros" name="volume" value={formData.volume} onChange={handleChange} />
                                <InputField label="Quantidade Atual" placeholder="0" type="number" name="quantity" value={formData.quantity} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <InputField label="Quantidade Mínima" placeholder="0" type="number" name="minQuantity" value={formData.minQuantity} onChange={handleChange} />
                                <InputField label="Valor Total (R$)" placeholder="0,00" type="number" name="cost" value={formData.cost} onChange={handleChange} />
                            </div>
                            <p className="text-[10px] text-gray-400">Valor lançado automaticamente como despesa no financeiro.</p>
                        </div>
                    </section>
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button onClick={() => navigate(-1)} className="h-8 px-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold text-xs hover:bg-gray-100 transition-colors">Cancelar</button>
                        <button onClick={handleSubmit} disabled={submitting} className="h-8 px-5 rounded bg-primary text-white font-semibold text-xs hover:bg-primary-dark transition-colors disabled:opacity-60">
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
    const [saving, setSaving] = useState(false);

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
    
    const handleSave = async () => {
        if (!item) return;
        setSaving(true);
        try {
            await stockService.update({
                ...item,
                quantity: Number(item.quantity) || 0,
                minQuantity: Number(item.minQuantity) || 0
            });
            navigate('/stock');
        } catch (error) {
            console.error("Failed to update item", error);
            alert("Erro ao salvar alterações.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;
    if (!item) return <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">Insumo não encontrado.</p></div>;

    return (
        <>
            <header className="sticky top-0 z-10 flex items-center bg-white dark:bg-[#1a222d] px-3 justify-between border-b border-gray-200 dark:border-gray-700 h-11">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary hover:text-blue-700 text-xs font-semibold">
                    <span className="material-symbols-outlined text-[16px]">arrow_back_ios_new</span> Voltar
                </button>
                <h1 className="text-gray-900 dark:text-white text-sm font-bold">Editar Insumo</h1>
                <div className="w-16"></div>
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
                                    <option>5.01 Energia Elétrica — Consumo Variável</option>
                                    <option>5.02 Água e Saneamento — Consumo Variável</option>
                                    <option>5.03 Detergente Neutro Concentrado</option>
                                    <option>5.04 Alvejante de Oxigênio Ativo (sem cloro)</option>
                                    <option>5.05 Peróxido de Hidrogênio</option>
                                    <option>5.06 Produto Específico para Mofo</option>
                                    <option>5.07 Álcool Isopropílico</option>
                                    <option>5.08 Bicarbonato de Sódio</option>
                                    <option>5.09 Ácido Oxálico</option>
                                    <option>5.10 Sabão em Pó</option>
                                    <option>5.11 Vinagre Branco</option>
                                    <option>5.12 Embalagens — Sacolas e Papel de Embrulho</option>
                                    <option>5.13 Etiquetas e Material de Identificação</option>
                                    <option>5.14 Fita Crepe e Caneta Permanente</option>
                                    <option>5.15 Materiais de Limpeza do Espaço</option>
                                    <option>5.16 Amaciante</option>
                                    <option>5.17 Gás (Secadoras/Aquecimento)</option>
                                    <option>5.18 Combustível e Logística (Entregas)</option>
                                    <option>5.19 Outros Produtos Químicos / Tira-manchas</option>
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
                        <button onClick={handleSave} disabled={saving} className="h-12 px-8 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark shadow-md shadow-primary/20 transition-all disabled:opacity-50">
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
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