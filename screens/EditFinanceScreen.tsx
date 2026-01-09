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
            if (!transactionId) {
                navigate('/payments');
                return;
            }

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
                
                // Convert date to YYYY-MM-DD format for input
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

    // Reset categories when type changes (optional, but good UX if user switches type)
    // Note: We need to be careful not to reset immediately on load, but only on user interaction if we tracked that better.
    // For simplicity, we assume if type changes from what was loaded, we should probably reset unless it matches the group map.

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            alert('Preencha um valor válido');
            return;
        }

        if (!transactionId) return;

        // Ensure category is selected if user changed type or cleared it
        if (!selectedCategory || !selectedGroup) {
            alert('Selecione uma categoria');
            return;
        }

        const finalDescription = description.trim() || selectedCategory;

        setSubmitting(true);
        try {
            const transaction = {
                type,
                description: finalDescription,
                clientName: '',
                amount: parseFloat(amount),
                date: date, // Keep ISO format YYYY-MM-DD
                paid: true,
                icon: type === TransactionType.Receita ? 'trending_up' : 'trending_down',
                category: selectedCategory,
                group: selectedGroup
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
        if (type === TransactionType.Receita) {
            return Object.keys(FINANCE_CATEGORIES.REVENUE);
        }
        return Object.keys(FINANCE_CATEGORIES.EXPENSE);
    };

    const getCategories = () => {
        if (!selectedGroup) return [];
        if (type === TransactionType.Receita) {
            return (FINANCE_CATEGORIES.REVENUE as any)[selectedGroup] || [];
        }
        return (FINANCE_CATEGORIES.EXPENSE as any)[selectedGroup] || [];
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
            </div>
        );
    }

    return (
        <>
            <header className="flex items-center bg-surface-light dark:bg-surface-dark px-4 py-4 justify-between border-b border-gray-200 dark:border-gray-800 shrink-0 z-20">
                <button onClick={() => navigate(-1)} className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[#111418] dark:text-white">arrow_back</span>
                </button>
                <h1 className="text-[#111418] dark:text-white text-lg font-bold">Editar Movimentação</h1>
                <div className="size-10"></div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
                <div className="max-w-2xl mx-auto space-y-6">
                    
                    {/* Transaction Type */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Tipo de Movimentação</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    setType(TransactionType.Receita);
                                    setSelectedGroup('');
                                    setSelectedCategory('');
                                }}
                                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                    type === TransactionType.Receita
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                            >
                                <span className="material-symbols-outlined">trending_up</span>
                                <span className="font-bold">Receita</span>
                            </button>
                            <button
                                onClick={() => {
                                    setType(TransactionType.Despesa);
                                    setSelectedGroup('');
                                    setSelectedCategory('');
                                }}
                                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                    type === TransactionType.Despesa
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                            >
                                <span className="material-symbols-outlined">trending_down</span>
                                <span className="font-bold">Despesa</span>
                            </button>
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Classificação</label>
                        
                        <div className="grid gap-4">
                            {/* Group Selection */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">Grupo</label>
                                <div className="relative">
                                    <select
                                        value={selectedGroup}
                                        onChange={(e) => {
                                            setSelectedGroup(e.target.value);
                                            setSelectedCategory('');
                                        }}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                        <option value="">Selecione um grupo</option>
                                        {getGroups().map(group => (
                                            <option key={group} value={group}>{group}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Subcategory Selection */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">Categoria</label>
                                <div className="relative">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        disabled={!selectedGroup}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">{selectedGroup ? 'Selecione uma categoria' : 'Selecione um grupo primeiro'}</option>
                                        {getCategories().map((category: string) => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Descrição</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descrição opcional (preenchida automaticamente com a categoria)"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            autoFocus
                        />
                    </div>

                    {/* Amount */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Valor (R$)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl font-bold">R$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0,00"
                                step="0.01"
                                min="0"
                                className="w-full pl-14 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xl font-bold focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Data</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                </div>
            </main>

            {/* Submit Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#1a222d] border-t border-gray-100 dark:border-gray-800 z-20">
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !selectedCategory || !amount || parseFloat(amount) <= 0}
                    className="w-full rounded-xl bg-primary h-14 text-white text-lg font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors"
                >
                    {submitting ? (
                        <>
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                            <span>Salvando...</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">check</span>
                            <span>Salvar Alterações</span>
                        </>
                    )}
                </button>
            </div>
        </>
    );
};

export default EditFinanceScreen;
