import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { financeService } from '../services/financeService';
import { orderService } from '../services/orderService';
import { generateFinanceReportPDF } from '../utils/financePdfGenerator';
import { Transaction, TransactionType } from '../types';
import Header from '../components/Header';

export const FinanceReportsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    
    // Default to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [filteredData, setFilteredData] = useState<Transaction[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterData();
    }, [startDate, endDate, transactions]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [financeData, ordersData] = await Promise.all([
                financeService.getAll(),
                orderService.getAll()
            ]);

            // Convert Orders to Transactions
            const orderTransactions: Transaction[] = ordersData.map(order => {
                // Determine date: use timestamp or today fallback
                let dateStr = new Date().toISOString().split('T')[0];
                if (order.timestamp) {
                    const d = new Date(order.timestamp);
                    if (!isNaN(d.getTime())) {
                        dateStr = d.toISOString().split('T')[0];
                    }
                }

                return {
                    id: `order-${order.id}`,
                    type: TransactionType.Receita, // Orders are Revenue
                    description: `Pedido #${order.id} - ${order.client.name}`,
                    clientName: order.client.name,
                    date: dateStr,
                    amount: order.value || 0,
                    paid: true,
                    icon: 'local_laundry_service',
                    category: order.service || 'Serviços Diversos', // Use actual service name
                    group: 'Receita de Serviços',
                    clientType: order.client.type || 'Pessoa Física' // Default to PF if undefined
                };
            });

            // Merge finance entries + orders
            // Sort by date descending
            const allData = [...financeData, ...orderTransactions].sort((a, b) => {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });

            setTransactions(allData);
        } catch (error) {
            console.error("Erro ao carregar dados financeiros e pedidos", error);
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const filtered = transactions.filter(t => {
            // Converter data da transação (dd/mm/yyyy ou yyyy-mm-dd)
            let tDate: Date;
            if (t.date.includes('/')) {
                const parts = t.date.split('/');
                tDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            } else {
                tDate = new Date(t.date);
            }
            return tDate >= start && tDate <= end;
        });

        setFilteredData(filtered);
    };

    const handleExportPDF = () => {
        if (filteredData.length === 0) {
            alert("Não há dados para exportar no período selecionado.");
            return;
        }
        generateFinanceReportPDF(filteredData, startDate, endDate);
    };

    // Calculate totals for preview
    const totalRevenue = filteredData
        .filter(t => t.type === TransactionType.Receita)
        .reduce((acc, t) => acc + t.amount, 0);
        
    const totalExpense = filteredData
        .filter(t => t.type === TransactionType.Despesa)
        .reduce((acc, t) => acc + t.amount, 0);

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <Header title="Relatórios Financeiros" onMenuClick={toggleSidebar} />
            
            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* Filters */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Filtros de Período</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Data Inicial</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Data Final</label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-800">
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">Receitas</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">R$ {totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-800">
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">Despesas</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">R$ {totalExpense.toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Saldo</p>
                        <p className={`text-2xl font-bold ${(totalRevenue - totalExpense) >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-600'}`}>
                            R$ {(totalRevenue - totalExpense).toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <button 
                    onClick={handleExportPDF}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all"
                >
                    <span className="material-symbols-outlined">description</span>
                    Baixar Relatório em PDF
                </button>

                {/* Preview List (Reduced) */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-gray-800 dark:text-white">Pré-visualização ({filteredData.length} lançamentos)</h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-96 overflow-y-auto">
                        {filteredData.length > 0 ? filteredData.map(t => (
                            <div key={t.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{t.description}</p>
                                    <p className="text-xs text-gray-500">{t.date} • {t.category || 'Sem categoria'}</p>
                                </div>
                                <span className={`font-bold ${t.type === TransactionType.Receita ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === TransactionType.Receita ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                </span>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-gray-500">Nenhum dado encontrado neste período.</div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
