import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransactionType } from '../types';
import { financeService } from '../services/financeService';

const NewFinanceScreen: React.FC = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    
    const [type, setType] = useState<TransactionType>(TransactionType.Despesa);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = async () => {
        if (!description.trim() || !amount || parseFloat(amount) <= 0) {
            alert('Preencha todos os campos corretamente');
            return;
        }

        setSubmitting(true);
        try {
            const transaction = {
                type,
                description: description.trim(),
                clientName: '', // Finance transactions don't have clients
                amount: parseFloat(amount),
                date: date, // Keep ISO format YYYY-MM-DD
                paid: true,
                icon: type === TransactionType.Receita ? 'trending_up' : 'trending_down'
            };

            await financeService.create(transaction);
            navigate('/dashboard');
        } catch (error: any) {
            console.error('Failed to create transaction', error);
            alert(`Erro ao criar movimentação: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <header className="flex items-center bg-surface-light dark:bg-surface-dark px-4 py-4 justify-between border-b border-gray-200 dark:border-gray-800 shrink-0 z-20">
                <button onClick={() => navigate(-1)} className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[#111418] dark:text-white">arrow_back</span>
                </button>
                <h1 className="text-[#111418] dark:text-white text-lg font-bold">Nova Movimentação</h1>
                <div className="size-10"></div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
                <div className="max-w-2xl mx-auto space-y-6">
                    
                    {/* Transaction Type */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Tipo de Movimentação</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setType(TransactionType.Receita)}
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
                                onClick={() => setType(TransactionType.Despesa)}
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

                    {/* Description */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Descrição</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={type === TransactionType.Receita ? "Ex: Serviço extra, Venda de produto" : "Ex: Aluguel, Água, Luz, Salário"}
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
                    disabled={submitting || !description.trim() || !amount || parseFloat(amount) <= 0}
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
                            <span>Salvar Movimentação</span>
                        </>
                    )}
                </button>
            </div>
        </>
    );
};

export default NewFinanceScreen;
