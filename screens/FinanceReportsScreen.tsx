import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { financeService } from '../services/financeService';
import { orderService } from '../services/orderService';
import { clientService } from '../services/clientService';
import { generateFinanceReportPDF } from '../utils/financePdfGenerator';
import { feeUtils } from '../utils/feeUtils';
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
            const [financeData, ordersData, clientsData] = await Promise.all([
                financeService.getAll(),
                orderService.getAll(),
                clientService.getAll(true) // Include hidden clients to ensure historical matching
            ]);

            // Create client map for quick lookup
            const clientMap = new Map(clientsData.map(c => [c.id, c]));

            // Convert Orders to Transactions
            const orderTransactions: Transaction[] = ordersData.map(order => {
                // Determine date: use timestamp or today fallback
                // Determine date: use timestamp EXACTLY as in database (created_at)
                let dateStr = "";
                if (order.timestamp) {
                    // orderService.getAll returns timestamp as .toLocaleString('pt-BR') which is "dd/mm/yyyy hh:mm:ss" OR "dd/mm/yyyy, hh:mm:ss"
                    if (order.timestamp.includes('/')) {
                       // Parse "30/12/2025 ..." -> "2025-12-30" for input[type='date'] compatibility
                       const datePart = order.timestamp.split(',')[0].trim().split(' ')[0]; // Get "30/12/2025"
                       const [day, month, year] = datePart.split('/');
                       if (day && month && year) {
                           dateStr = `${year}-${month}-${day}`;
                       }
                    } else if (order.timestamp.includes('-')) {
                        // ISO Format fallback
                        dateStr = order.timestamp.split('T')[0];
                    }
                }
                
                // Final fallback only if parsing failed completely
                if (!dateStr || dateStr.length !== 10) {
                     dateStr = new Date().toISOString().split('T')[0];
                }

                // Get latest client type from live database, fallback to snapshot
                const realClient = clientMap.get(order.client.id);
                const clientType = realClient?.type || order.client.type || 'Pessoa Física';

                // Calculate Fees
                // Calculate Fees
                const grossAmount = order.value || 0;
                let feeVal = 0;
                let netAmount = 0;

                // Priority: Use stored values (Historical Accuracy)
                // If the order has a stored fee/netValue (meaning it was paid and saved with specific rates), use it.
                if (typeof order.fee === 'number' && (order.fee > 0 || order.netValue)) {
                    feeVal = order.fee;
                    netAmount = order.netValue || (grossAmount - feeVal);
                } else {
                    // Fallback: Calculate dynamically (for old orders or if data missing)
                    const feesConfig = feeUtils.getFees();
                    netAmount = feeUtils.calculateNetValue(grossAmount, order.payment_method || '', feesConfig);
                    feeVal = parseFloat((grossAmount - netAmount).toFixed(2));
                }

                return {
                    id: `order-${order.id}`,
                    type: TransactionType.Receita, // Orders are Revenue
                    description: `Pedido #${order.id} - ${order.client.name}`,
                    clientName: order.client.name,
                    date: dateStr,
                    amount: grossAmount, // Store Gross as main amount for compatibility
                    fee: feeVal,
                    netValue: netAmount,
                    paid: true,
                    icon: 'local_laundry_service',
                    category: order.service || 'Serviços Diversos', 
                    group: 'Receita de Serviços',
                    clientType: clientType
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

    const handleExportCSV = () => {
        if (filteredData.length === 0) {
            alert("Não há dados para exportar no período selecionado.");
            return;
        }

        // CSV Header
        const headers = ["ID", "Data", "Descrição", "Tipo", "Categoria", "Grupo", "Cliente", "Tipo de Cliente", "Valor Bruto", "Taxas", "Valor Líquido", "Pago"];
        
        // CSV Rows
        const rows = filteredData.map(t => {
            const gross = t.amount;
            const fee = t.fee || 0;
            const net = t.amount - fee;
            
            return [
                t.id,
                new Date(t.date).toLocaleDateString('pt-BR'),
                `"${t.description.replace(/"/g, '""')}"`,
                t.type,
                `"${(t.category || '').replace(/"/g, '""')}"`,
                t.group || '',
                `"${(t.clientName || '').replace(/"/g, '""')}"`,
                t.clientType || '',
                gross.toString().replace('.', ','),
                fee.toString().replace('.', ','),
                net.toString().replace('.', ','),
                t.paid ? "Sim" : "Não"
            ];
        });

        // Combine
        const csvContent = [
            headers.join(';'), // Use ; for Excel compatibility in BR region
            ...rows.map(row => row.join(';'))
        ].join('\n');

        // Create download link
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel UTF-8
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Relatorio_Financeiro_${startDate}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

                {/* Summary Cards - Premium Style */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Net Profit Card - Highlighted (Solid Primary) */}
                    <div className="md:col-span-1 bg-primary text-white p-6 rounded-2xl shadow-xl shadow-primary/20 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-9xl">account_balance_wallet</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-4 relative z-10">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                            </div>
                            <span className="font-medium text-white/90 text-sm tracking-wide">LUCRO LÍQUIDO</span>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-medium text-white/80">R$</span>
                                <span className="text-4xl font-bold tracking-tight">{(totalRevenue - totalExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <p className="text-white/60 text-xs mt-2 font-medium">
                                No período selecionado
                            </p>
                        </div>
                    </div>

                    {/* Revenue Card - White/Clean */}
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between group hover:border-green-200 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                                    <span className="material-symbols-outlined text-xl">trending_up</span>
                                </div>
                                <span className="font-medium text-gray-500 text-sm tracking-wide">RECEITAS</span>
                            </div>
                            <span className="material-symbols-outlined text-green-200 text-4xl group-hover:text-green-500/20 transition-colors">payments</span>
                        </div>
                        <div>
                            <span className="text-3xl font-bold text-gray-800 dark:text-white">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div className="bg-green-500 h-full rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Expense Card - White/Clean */}
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between group hover:border-red-200 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                                    <span className="material-symbols-outlined text-xl">trending_down</span>
                                </div>
                                <span className="font-medium text-gray-500 text-sm tracking-wide">DESPESAS</span>
                            </div>
                            <span className="material-symbols-outlined text-red-200 text-4xl group-hover:text-red-500/20 transition-colors">money_off</span>
                        </div>
                        <div>
                            <span className="text-3xl font-bold text-gray-800 dark:text-white">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min((totalExpense / (totalRevenue || 1)) * 100, 100)}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 text-right">
                                {((totalExpense / (totalRevenue || 1)) * 100).toFixed(1)}% da receita
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={handleExportPDF}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all"
                    >
                        <span className="material-symbols-outlined">description</span>
                        Baixar Relatório em PDF
                    </button>
                    <button 
                        onClick={handleExportCSV}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-600/30 transition-all"
                    >
                        <span className="material-symbols-outlined">table_view</span>
                        Baixar Planilha (CSV)
                    </button>
                </div>

                {/* Preview List (Reduced) */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 grid grid-cols-12 gap-4">
                        <div className="col-span-12 md:col-span-5 font-bold text-gray-800 dark:text-white">Descrição</div>
                        <div className="hidden md:block col-span-2 font-bold text-right text-gray-800 dark:text-white">Bruto</div>
                        <div className="hidden md:block col-span-2 font-bold text-right text-gray-800 dark:text-white">Taxas</div>
                        <div className="hidden md:block col-span-3 font-bold text-right text-gray-800 dark:text-white">Líquido</div>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-96 overflow-y-auto">
                        {filteredData.length > 0 ? filteredData.map(t => {
                            const fee = t.fee || 0;
                            const net = t.amount - fee;
                            return (
                            <div key={t.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <div className="col-span-12 md:col-span-5">
                                    <p className="font-medium text-gray-900 dark:text-white">{t.description}</p>
                                    <p className="text-xs text-gray-500">{t.date} • {t.category || 'Sem categoria'}</p>
                                    {/* Mobile View for values */}
                                    <div className="md:hidden mt-2 flex justify-between text-sm">
                                        <span className="text-gray-500">Bruto: R$ {t.amount.toFixed(2)}</span>
                                        <span className={t.type === TransactionType.Receita ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>Net: R$ {net.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="hidden md:block col-span-2 text-right font-medium text-gray-600 dark:text-gray-300">
                                    R$ {t.amount.toFixed(2)}
                                </div>
                                <div className="hidden md:block col-span-2 text-right font-medium text-red-500 dark:text-red-400">
                                    {fee > 0 ? `- R$ ${fee.toFixed(2)}` : '-'}
                                </div>
                                <div className={`hidden md:block col-span-3 text-right font-bold ${t.type === TransactionType.Receita ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === TransactionType.Receita ? '+' : '-'} R$ {net.toFixed(2)}
                                </div>
                            </div>
                        )}) : (
                            <div className="p-8 text-center text-gray-500">Nenhum dado encontrado neste período.</div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
