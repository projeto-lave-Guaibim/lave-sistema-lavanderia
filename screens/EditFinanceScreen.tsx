import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TransactionType } from '../types';
import { financeService } from '../services/financeService';
import { FINANCE_CATEGORIES } from '../constants/financeCategories';

const EditFinanceScreen: React.FC = () => {
    const navigate = useNavigate();
    const { transactionId } = useParams<{ transactionId: string }>();
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [type, setType] = useState<TransactionType>(TransactionType.Despesa);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        const loadTransaction = async () => {
            if (!transactionId) { navigate('/payments'); return; }
            try {
                const transaction = await financeService.getById(transactionId);
                if (!transaction) {
                    alert('Movimentação não encontrada');
                    navigate('/payments');
                    return;
                }
                setType(transaction.type);
                setDescription(transaction.description);
                setAmount(transaction.amount.toString());
                if (transaction.group) setSelectedGroup(transaction.group);
                if (transaction.category) setSelectedCategory(transaction.category);
                if (transaction.date.includes('/')) {
                    const [d, m, y] = transaction.date.split('/');
                    setDate(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
                } else {
                    setDate(transaction.date);
                }
            } catch (error: any) {
                console.error('Failed to load transaction', error);
                alert('Erro ao carregar movimentação');
                navigate('/payments');
            } finally {
                setLoading(false);
            }
        };
        loadTransaction();
    }, [transactionId, navigate]);

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) { alert('Preencha um valor válido'); return; }
        if (!transactionId) return;
        if (!selectedCategory || !selectedGroup) { alert('Selecione uma categoria'); return; }

        const finalDescription = description.trim() || selectedCategory;
        setSubmitting(true);
        try {
            const transaction = {
                type, description: finalDescription, clientName: '',
                amount: parseFloat(amount), date, paid: true,
                icon: type === TransactionType.Receita ? 'trending_up' : 'trending_down',
                category: selectedCategory, group: selectedGroup
            };
            await financeService.update(transactionId, transaction);
            navigate('/payments');
        } catch (error: any) {
            console.error('Failed to update transaction', error);
            alert(`Erro ao atualizar movimentação: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const getGroups = () => {
        if (type === TransactionType.Receita) return Object.keys(FINANCE_CATEGORIES.REVENUE);
        return Object.keys(FINANCE_CATEGORIES.EXPENSE);
    };

    const getCategories = () => {
        if (!selectedGroup) return [];
        if (type === TransactionType.Receita) return (FINANCE_CATEGORIES.REVENUE as any)[selectedGroup] || [];
        return (FINANCE_CATEGORIES.EXPENSE as any)[selectedGroup] || [];
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
            </div>
        );
    }

    const fieldClass = "w-full h-8 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2.5 text-xs focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all";
    const labelClass = "block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1";

    return (
        <>
            <header className="flex items-center bg-white dark:bg-[#1a222d] px-3 justify-between border-b border-gray-200 dark:border-gray-700 h-11 shrink-0 z-20">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary hover:text-blue-700 text-xs font-semibold">
                    <span className="material-symbols-outlined text-[16px]">arrow_back_ios_new</span> Voltar
                </button>
                <h1 className="text-gray-900 dark:text-white text-sm font-bold">Editar Movimentação</h1>
                <div className="w-16"></div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar p-3 pb-24 bg-[#eef0f3] dark:bg-[#111821]">
                <div className="max-w-lg mx-auto space-y-3">

                    {/* Type selector */}
                    <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e2a38] px-3 py-1.5">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Tipo de Movimentação</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 p-3">
                            <button
                                onClick={() => { setType(TransactionType.Receita); setSelectedGroup(''); setSelectedCategory(''); }}
                                className={`flex items-center justify-center gap-1.5 h-9 rounded border-2 transition-all text-xs font-bold ${
                                    type === TransactionType.Receita
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                                Receita
                            </button>
                            <button
                                onClick={() => { setType(TransactionType.Despesa); setSelectedGroup(''); setSelectedCategory(''); }}
                                className={`flex items-center justify-center gap-1.5 h-9 rounded border-2 transition-all text-xs font-bold ${
                                    type === TransactionType.Despesa
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[16px]">trending_down</span>
                                Despesa
                            </button>
                        </div>
                    </div>

                    {/* Classification */}
                    <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e2a38] px-3 py-1.5">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Classificação</span>
                        </div>
                        <div className="p-3 grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Grupo</label>
                                <select
                                    value={selectedGroup}
                                    onChange={(e) => { setSelectedGroup(e.target.value); setSelectedCategory(''); }}
                                    className={fieldClass}
                                >
                                    <option value="">Selecione...</option>
                                    {getGroups().map(group => (
                                        <option key={group} value={group}>{group}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Categoria</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    disabled={!selectedGroup}
                                    className={`${fieldClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <option value="">{selectedGroup ? 'Selecione...' : '— grupo primeiro —'}</option>
                                    {getCategories().map((category: string) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e2a38] px-3 py-1.5">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Detalhes</span>
                        </div>
                        <div className="p-3 space-y-3">
                            <div>
                                <label className={labelClass}>Descrição</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Descrição da movimentação"
                                    className={fieldClass}
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Valor (R$)</label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none select-none">R$</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0,00"
                                            step="0.01"
                                            min="0"
                                            className={`${fieldClass} font-bold`}
                                            style={{ paddingLeft: '36px' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Data</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className={fieldClass}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <div className="shrink-0 px-3 py-2 bg-white dark:bg-[#1a222d] border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
                <button onClick={() => navigate(-1)} className="h-8 px-4 rounded border border-gray-300 dark:border-gray-600 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition-colors">
                    Cancelar
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !selectedCategory || !amount || parseFloat(amount) <= 0}
                    className="h-8 px-5 rounded bg-primary text-white text-xs font-bold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                    {submitting ? (
                        <><span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span> Salvando...</>
                    ) : (
                        <><span className="material-symbols-outlined text-[14px]">check</span> Salvar Alterações</>
                    )}
                </button>
            </div>
        </>
    );
};

export default EditFinanceScreen;
