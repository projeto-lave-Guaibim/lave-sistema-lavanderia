import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Order, OrderStatus, Transaction, TransactionType, StockItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { orderService } from '../services/orderService';
import { financeService } from '../services/financeService';
import { stockService } from '../services/stockService';

import Header from '../components/Header';
import { useOutletContext } from 'react-router-dom';

const DashboardScreen: React.FC = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    
    const [loading, setLoading] = useState(true);
    const [stockAlert, setStockAlert] = useState<StockItem | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [chartData, setChartData] = useState<{ day: string; income: number; expense: number }[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showValues, setShowValues] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ordersData, financeData, stockData] = await Promise.all([
                    orderService.getAll(),
                    financeService.getAll(),
                    stockService.getAll()
                ]);

                const orderTransactions: Transaction[] = ordersData.map(order => ({
                    id: (100000 + order.id).toString(),
                    type: TransactionType.Receita,
                    description: `Pedido #${order.id.toString().padStart(4, '0')} - ${order.client.name}`,
                    clientName: order.client.name,
                    date: new Date(order.timestamp).toLocaleDateString('pt-BR'),
                    amount: order.value || 0,
                    paid: order.status === OrderStatus.Entregue,
                    icon: 'local_laundry_service'
                }));

                const allTransactions = [...financeData, ...orderTransactions].sort((a, b) => {
                    const dateA = a.date.includes('/') ? a.date.split('/').reverse().join('-') : a.date;
                    const dateB = b.date.includes('/') ? b.date.split('/').reverse().join('-') : b.date;
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                });

                setTransactions(allTransactions);

                const alertItem = stockData.find(item => item.quantity <= item.minQuantity);
                setStockAlert(alertItem || null);

                const today = new Date();
                const last15Days = Array.from({ length: 15 }, (_, i) => {
                    const d = new Date();
                    d.setDate(today.getDate() - (14 - i));
                    return d;
                });

                const chart = last15Days.map(date => {
                    const dayTransactions = allTransactions.filter(t => {
                        let tDate: Date;
                        if (t.date.includes('/')) {
                            const [d, m, y] = t.date.split('/').map(Number);
                            tDate = new Date(y, m - 1, d);
                        } else {
                            const [y, m, d] = t.date.split('-').map(Number);
                            tDate = new Date(y, m - 1, d);
                        }
                        return tDate.getDate() === date.getDate() &&
                               tDate.getMonth() === date.getMonth() &&
                               tDate.getFullYear() === date.getFullYear();
                    });

                    const dayIncome = dayTransactions.filter(t => t.type === TransactionType.Receita).reduce((acc, curr) => acc + curr.amount, 0);
                    const dayExpense = dayTransactions.filter(t => t.type === TransactionType.Despesa).reduce((acc, curr) => acc + curr.amount, 0);
                    return { day: date.getDate().toString(), income: dayIncome, expense: dayExpense };
                });
                setChartData(chart);

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
        const handleVisibilityChange = () => { if (!document.hidden) fetchData(); };
        const handleFocus = () => fetchData();
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const monthlyTransactions = useMemo(() => {
        return transactions.filter(tx => {
            let dateObj: Date;
            if (tx.date.includes('/')) {
                const [day, month, year] = tx.date.split('/').map(Number);
                dateObj = new Date(year, month - 1, day);
            } else {
                const [year, month, day] = tx.date.split('-').map(Number);
                dateObj = new Date(year, month - 1, day);
            }
            return dateObj.getMonth() === currentDate.getMonth() && dateObj.getFullYear() === currentDate.getFullYear();
        });
    }, [transactions, currentDate]);

    const metrics = useMemo(() => {
        const income = monthlyTransactions.filter(t => t.type === TransactionType.Receita && t.paid).reduce((acc, curr) => acc + curr.amount, 0);
        const expense = monthlyTransactions.filter(t => t.type === TransactionType.Despesa).reduce((acc, curr) => acc + curr.amount, 0);
        const receivables = monthlyTransactions.filter(t => t.type === TransactionType.Receita && !t.paid).reduce((acc, curr) => acc + curr.amount, 0);
        const currentMonthProfit = income - expense;

        const prevMonthDate = new Date(currentDate);
        prevMonthDate.setMonth(currentDate.getMonth() - 1);
        const prevMonthTransactions = transactions.filter(tx => {
            let dateObj: Date;
            if (tx.date.includes('/')) {
                const [day, month, year] = tx.date.split('/').map(Number);
                dateObj = new Date(year, month - 1, day);
            } else {
                const [year, month, day] = tx.date.split('-').map(Number);
                dateObj = new Date(year, month - 1, day);
            }
            return dateObj.getMonth() === prevMonthDate.getMonth() && dateObj.getFullYear() === prevMonthDate.getFullYear();
        });

        const prevIncome = prevMonthTransactions.filter(t => t.type === TransactionType.Receita && t.paid).reduce((acc, curr) => acc + curr.amount, 0);
        const prevExpense = prevMonthTransactions.filter(t => t.type === TransactionType.Despesa).reduce((acc, curr) => acc + curr.amount, 0);
        const prevMonthProfit = prevIncome - prevExpense;
        const cashFlow = currentMonthProfit + prevMonthProfit;

        return { income, expense, profit: currentMonthProfit, receivables, cashFlow };
    }, [monthlyTransactions, transactions, currentDate]);

    const renderChart = () => {
        if (chartData.length === 0) return null;
        const maxVal = Math.max(...chartData.map(d => Math.max(d.income, d.expense)), 100);
        const getPoints = (type: 'income' | 'expense') =>
            chartData.map((d, i) => `${(i / (chartData.length - 1)) * 100},${100 - ((d[type] / maxVal) * 100)}`).join(' ');

        return (
            <div className="h-32 w-full relative mt-3">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.5" />
                    <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.5" />
                    <polyline fill="none" stroke="#22c55e" strokeWidth="1.5" points={getPoints('income')} vectorEffect="non-scaling-stroke" />
                    <polyline fill="none" stroke="#ef4444" strokeWidth="1.5" points={getPoints('expense')} vectorEffect="non-scaling-stroke" />
                </svg>
                <div className="flex justify-between mt-1 text-[10px] text-gray-400 px-1">
                    {chartData.filter((_, i) => i % 3 === 0).map((d, i) => <span key={i}>{d.day}</span>)}
                </div>
            </div>
        );
    };

    const handleTransactionClick = (transaction: Transaction) => {
        if (transaction.description.startsWith('Pedido #')) {
            const orderIdMatch = transaction.description.match(/#(\d+)/);
            if (orderIdMatch && orderIdMatch[1]) navigate(`/orders/${parseInt(orderIdMatch[1], 10)}`);
        }
    };

    const fmt = (v: number) => showValues
        ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : 'R$ ••••';

    if (loading) return <div className="flex justify-center items-center h-full"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;

    return (
        <>
            <Header
                title="Dashboard"
                onMenuClick={toggleSidebar}
                leftIcon={
                    <div className="flex w-7 h-7 shrink-0 items-center justify-center bg-primary/10 rounded">
                        <span className="material-symbols-outlined text-primary text-[16px]">local_laundry_service</span>
                    </div>
                }
                rightActions={
                    <>
                        <button onClick={() => setShowValues(!showValues)} className="flex items-center justify-center rounded w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title={showValues ? 'Ocultar valores' : 'Mostrar valores'}>
                            <span className="material-symbols-outlined text-[18px] text-gray-600 dark:text-gray-300">{showValues ? 'visibility' : 'visibility_off'}</span>
                        </button>
                        <button onClick={toggleTheme} className="flex items-center justify-center rounded w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-gray-600 dark:text-gray-300">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                        </button>
                        <button onClick={() => alert('Sem novas notificações')} className="flex items-center justify-center rounded w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-gray-600 dark:text-gray-300">notifications</span>
                        </button>
                        <Link to="/profile" className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-gray-600" style={{ background: '#d1d8e0' }}>
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-[14px]">person</span>
                            </div>
                        </Link>
                    </>
                }
            />
            <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
                <div className="flex flex-col gap-3 p-3">

                    {/* Financial Summary Cards — ERP style */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {/* Lucro — Primary */}
                        <div className="flex flex-col justify-between gap-2 rounded bg-primary p-3 border border-primary-dark">
                            <div className="flex items-center gap-1.5 text-white/80">
                                <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                                <p className="text-xs font-semibold uppercase tracking-wide">Lucro</p>
                            </div>
                            <div>
                                <p className="text-white text-xl font-bold">{fmt(metrics.profit)}</p>
                                <p className="text-white/60 text-[10px] mt-0.5">A Receber: {fmt(metrics.receivables)}</p>
                            </div>
                        </div>
                        {/* Receita */}
                        <div className="flex flex-col justify-between gap-2 rounded bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-[16px] text-green-500">payments</span>
                                    <p className="text-xs font-semibold uppercase tracking-wide">Receita</p>
                                </div>
                            </div>
                            <p className="text-gray-900 dark:text-white text-xl font-bold">{fmt(metrics.income)}</p>
                        </div>
                        {/* Despesa */}
                        <div className="flex flex-col justify-between gap-2 rounded bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-[16px] text-red-500">shopping_cart</span>
                                    <p className="text-xs font-semibold uppercase tracking-wide">Despesa</p>
                                </div>
                            </div>
                            <p className="text-gray-900 dark:text-white text-xl font-bold">{fmt(metrics.expense)}</p>
                        </div>
                        {/* Fluxo de Caixa */}
                        <div className="flex flex-col justify-between gap-2 rounded bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 p-3">
                            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                <span className="material-symbols-outlined text-[16px] text-blue-500">savings</span>
                                <p className="text-xs font-semibold uppercase tracking-wide">Fluxo Caixa</p>
                            </div>
                            <div>
                                <p className="text-gray-900 dark:text-white text-xl font-bold">{fmt(metrics.cashFlow)}</p>
                                <p className="text-gray-400 text-[10px] mt-0.5">Capital de Giro</p>
                            </div>
                        </div>
                    </div>

                    {/* Month Filter — compact toolbar style */}
                    <div className="flex items-center justify-between bg-white dark:bg-[#1a222d] rounded border border-gray-200 dark:border-gray-700 px-3 py-2">
                        <button
                            onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth()-1); setCurrentDate(d); }}
                            className="flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px] text-gray-600 dark:text-gray-300">chevron_left</span>
                        </button>
                        <h3 className="text-gray-900 dark:text-white text-sm font-semibold capitalize">
                            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                            onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth()+1); setCurrentDate(d); }}
                            className="flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px] text-gray-600 dark:text-gray-300">chevron_right</span>
                        </button>
                    </div>

                    {/* Chart */}
                    <div className="bg-white dark:bg-[#1a222d] rounded border border-gray-200 dark:border-gray-700 p-3">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-gray-800 dark:text-white text-sm font-semibold">Movimentação — últimos 15 dias</h3>
                            <div className="flex gap-3 text-[10px] font-semibold">
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-gray-500">Receita</span></div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-gray-500">Despesa</span></div>
                            </div>
                        </div>
                        {renderChart()}
                    </div>

                    {/* Stock Alert */}
                    {stockAlert && (
                        <div className="flex items-center gap-2 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-2.5">
                            <span className="material-symbols-outlined text-orange-500 text-[18px]">warning</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">Estoque Baixo: <b>{stockAlert.name}</b> ({stockAlert.quantity} {stockAlert.volume})</p>
                            </div>
                            <Link to="/stock" className="text-orange-600 dark:text-orange-400 text-xs font-bold hover:underline shrink-0">Ver →</Link>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Ações Rápidas</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => navigate('/orders/new')} className="flex items-center justify-center gap-2 rounded bg-primary py-3 px-4 text-white hover:bg-primary-dark transition-colors">
                                <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                                <span className="text-sm font-semibold">Novo Pedido</span>
                            </button>
                            <button onClick={() => navigate('/finance/new')} className="flex items-center justify-center gap-2 rounded bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 py-3 px-4 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <span className="material-symbols-outlined text-primary text-[18px]">receipt_long</span>
                                <span className="text-sm font-semibold">Movimentação</span>
                            </button>
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className="pb-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Histórico do Mês</p>
                        <div className="rounded border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-[#1a222d]">
                            {monthlyTransactions.length > 0 ? (
                                monthlyTransactions.slice(0, 15).map((tx) => (
                                    <TransactionItem key={tx.id} transaction={tx} onClick={() => handleTransactionClick(tx)} />
                                ))
                            ) : (
                                <div className="text-center text-gray-400 py-8 text-sm">Nenhuma movimentação neste mês.</div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

const TransactionItem: React.FC<{ transaction: Transaction; onClick?: () => void }> = ({ transaction, onClick }) => (
    <div onClick={onClick} className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#232c38] transition-colors cursor-pointer">
        <div className={`flex items-center justify-center rounded shrink-0 w-8 h-8 ${transaction.type === TransactionType.Receita ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'}`}>
            <span className="material-symbols-outlined text-[15px]">{transaction.icon || (transaction.type === TransactionType.Receita ? 'trending_up' : 'trending_down')}</span>
        </div>
        <div className="flex flex-col flex-1 justify-center min-w-0">
            <p className="text-gray-800 dark:text-white text-xs font-semibold leading-tight line-clamp-1">{transaction.description}</p>
            <p className="text-gray-400 dark:text-gray-500 text-[10px]">{transaction.clientName} · {transaction.date}</p>
        </div>
        <div className="shrink-0 text-right">
            <p className={`${transaction.type === TransactionType.Receita ? 'text-green-600' : 'text-red-500'} text-xs font-bold`}>
                {transaction.type === TransactionType.Receita ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className={`text-[9px] px-1 py-px rounded ${transaction.paid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {transaction.paid ? 'PAGO' : 'PENDENTE'}
            </span>
        </div>
    </div>
);

export default DashboardScreen;