import React, { useState, useEffect } from 'react';
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
    const [financials, setFinancials] = useState({ income: 0, expense: 0, profit: 0 });
    const [stockAlert, setStockAlert] = useState<StockItem | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [chartData, setChartData] = useState<{ day: string; income: number; expense: number }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ordersData, financeData, stockData] = await Promise.all([
                    orderService.getAll(),
                    financeService.getAll(),
                    stockService.getAll()
                ]);

                // 1. Merge Orders and Transactions
                const orderTransactions: Transaction[] = ordersData.map(order => ({
                    id: (100000 + order.id).toString(),
                    type: TransactionType.Receita,
                    description: `Pedido #${order.id.toString().padStart(4, '0')} - ${order.client.name}`,
                    clientName: order.client.name,
                    date: order.timestamp.split(',')[0].trim(), // Assuming DD/MM/YYYY format from mock/GAS
                    amount: order.value || 0,
                    paid: order.status === OrderStatus.Entregue,
                    icon: 'local_laundry_service'
                }));

                const allTransactions = [...financeData, ...orderTransactions].sort((a, b) => {
                    // Sort by date descending
                    const dateA = a.date.includes('/') ? a.date.split('/').reverse().join('-') : a.date;
                    const dateB = b.date.includes('/') ? b.date.split('/').reverse().join('-') : b.date;
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                });

                setTransactions(allTransactions);

                // 2. Calculate Financials (Total)
                const income = allTransactions
                    .filter(t => t.type === TransactionType.Receita && t.paid)
                    .reduce((acc, curr) => acc + curr.amount, 0);
                
                const expense = allTransactions
                    .filter(t => t.type === TransactionType.Despesa)
                    .reduce((acc, curr) => acc + curr.amount, 0);

                setFinancials({ income, expense, profit: income - expense });

                // 3. Process Stock Alerts
                const alertItem = stockData.find(item => item.quantity <= item.minQuantity);
                setStockAlert(alertItem || null);

                // 4. Prepare Chart Data (Last 15 days)
                const today = new Date();
                const last15Days = Array.from({ length: 15 }, (_, i) => {
                    const d = new Date();
                    d.setDate(today.getDate() - (14 - i));
                    return d;
                });

                const chart = last15Days.map(date => {
                    const dateStr = date.toLocaleDateString('pt-BR'); // DD/MM/YYYY
                    // Also support YYYY-MM-DD for comparison if needed, but assuming data has DD/MM/YYYY or YYYY-MM-DD
                    
                    const dayTransactions = allTransactions.filter(t => {
                        // Normalize transaction date to Date object for comparison
                        let tDate: Date;
                        if (t.date.includes('/')) {
                            const [d, m, y] = t.date.split('/').map(Number);
                            tDate = new Date(y, m - 1, d);
                        } else {
                            tDate = new Date(t.date);
                            tDate = new Date(tDate.valueOf() + tDate.getTimezoneOffset() * 60000);
                        }
                        return tDate.getDate() === date.getDate() && 
                               tDate.getMonth() === date.getMonth() && 
                               tDate.getFullYear() === date.getFullYear();
                    });

                    const dayIncome = dayTransactions
                        .filter(t => t.type === TransactionType.Receita) // Include unpaid for trend? Or only paid? Let's show all activity.
                        .reduce((acc, curr) => acc + curr.amount, 0);
                    
                    const dayExpense = dayTransactions
                        .filter(t => t.type === TransactionType.Despesa)
                        .reduce((acc, curr) => acc + curr.amount, 0);

                    return {
                        day: date.getDate().toString(), // Just the day number for X-axis
                        fullDate: dateStr,
                        income: dayIncome,
                        expense: dayExpense
                    };
                });
                setChartData(chart);

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Chart Helper
    const renderChart = () => {
        if (chartData.length === 0) return null;
        
        const height = 160;
        const width = 100; // Percent
        const maxVal = Math.max(...chartData.map(d => Math.max(d.income, d.expense)), 100);
        
        const getPoints = (type: 'income' | 'expense') => {
            return chartData.map((d, i) => {
                const x = (i / (chartData.length - 1)) * 100;
                const y = 100 - ((d[type] / maxVal) * 100);
                return `${x},${y}`;
            }).join(' ');
        };

        return (
            <div className="h-40 w-full relative mt-4">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
                    <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
                    
                    {/* Income Line (Green) */}
                    <polyline
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2"
                        points={getPoints('income')}
                        vectorEffect="non-scaling-stroke"
                    />
                    {/* Expense Line (Red) */}
                    <polyline
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        points={getPoints('expense')}
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
                {/* X-Axis Labels */}
                <div className="flex justify-between mt-2 text-[10px] text-gray-400 px-1">
                    {chartData.filter((_, i) => i % 3 === 0).map((d, i) => (
                        <span key={i}>{d.day}</span>
                    ))}
                </div>
            </div>
        );
    };

    // Transaction Click Handler
    const handleTransactionClick = (transaction: Transaction) => {
        // Check if it's an order based on description format "Pedido #XXXX"
        if (transaction.description.startsWith('Pedido #')) {
            const orderIdMatch = transaction.description.match(/#(\d+)/);
            if (orderIdMatch && orderIdMatch[1]) {
                // Remove leading zeros to get the actual ID
                const orderId = parseInt(orderIdMatch[1], 10);
                navigate(`/orders/${orderId}`);
            }
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;

    return (
        <>
            <Header 
                title="Dashboard" 
                onMenuClick={toggleSidebar}
                leftIcon={<div className="flex size-10 shrink-0 items-center justify-center bg-primary/10 rounded-full"><span className="material-symbols-outlined text-primary">local_laundry_service</span></div>}
                rightActions={
                    <>
                        <button onClick={toggleTheme} className="flex items-center justify-center rounded-full size-10 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <span className="material-symbols-outlined text-[#111418] dark:text-white">
                                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>
                        <button onClick={() => alert('Sem novas notificações')} className="flex items-center justify-center rounded-full size-10 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <span className="material-symbols-outlined text-[#111418] dark:text-white">notifications</span>
                        </button>
                        <Link to="/profile" className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 ring-2 ring-white dark:ring-gray-700 shadow-sm cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDmPHpIUE4i7dS3UbI0BA_gk9yiQN9Z0yJsG5-mxJAvUVyKsWC8oBO1q4hJMDbSzQXBazNDO8iksfWNSzT9VChGaOhuRS4fAAxnW8zH5smroyIX9io6EVNx_79v_a3EQhLaPgbtX4o8eJ89svXZp1NXGkM36DXNbeBHw_2k52jGTgZhS4TvNu8m71ujnClsidaHfX86yz97Jv6BJlYS7zG7l9tHqk8_Du8_VLo-9H2G7XCouSi1g1ryzaVTJ7Ks8-SxRub7LwWl5GKa")` }}></Link>
                    </>
                }
            />
            <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
                <div className="flex flex-col gap-4 p-4">
                    
                    {/* Financial Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex flex-col justify-between gap-3 rounded-2xl bg-primary p-4 shadow-lg shadow-primary/20">
                            <div className="flex items-center gap-2 text-white/80"><span className="material-symbols-outlined text-[20px]">account_balance_wallet</span><p className="text-sm font-medium">Lucro Líquido</p></div>
                            <div>
                                <p className="text-white text-3xl font-bold tracking-tight">R$ {financials.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                        <div className="flex flex-col justify-between gap-3 rounded-2xl bg-white dark:bg-[#1a222d] border border-[#dce0e5] dark:border-gray-800 p-4">
                            <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[#637288] dark:text-gray-400"><span className="material-symbols-outlined text-[20px]">payments</span><p className="text-sm font-medium">Receita</p></div><div className="size-2 rounded-full bg-green-500"></div></div>
                            <p className="text-[#111418] dark:text-white text-2xl font-bold tracking-tight">R$ {financials.income.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="flex flex-col justify-between gap-3 rounded-2xl bg-white dark:bg-[#1a222d] border border-[#dce0e5] dark:border-gray-800 p-4">
                            <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[#637288] dark:text-gray-400"><span className="material-symbols-outlined text-[20px]">shopping_cart</span><p className="text-sm font-medium">Despesa</p></div><div className="size-2 rounded-full bg-red-500"></div></div>
                            <p className="text-[#111418] dark:text-white text-2xl font-bold tracking-tight">R$ {financials.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white dark:bg-[#1a222d] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[#111418] dark:text-white text-lg font-bold">Movimentação (15 dias)</h3>
                            <div className="flex gap-3 text-xs font-medium">
                                <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-green-500"></div><span className="text-gray-500">Receita</span></div>
                                <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-red-500"></div><span className="text-gray-500">Despesa</span></div>
                            </div>
                        </div>
                        {renderChart()}
                    </div>
                    
                    {/* Stock Alert */}
                    {stockAlert && (
                        <div className="flex items-start gap-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 p-4">
                            <div className="bg-orange-100 dark:bg-orange-800/40 rounded-full p-2 text-orange-600 dark:text-orange-400 shrink-0 flex items-center justify-center"><span className="material-symbols-outlined">inventory_2</span></div>
                            <div className="flex-1"><h4 className="text-sm font-bold text-orange-800 dark:text-orange-300">Alerta de Estoque</h4><p className="text-sm text-orange-700 dark:text-orange-400/80 leading-snug">O item <b>{stockAlert.name}</b> está com estoque baixo ({stockAlert.quantity} {stockAlert.volume}). Considere repor.</p></div>
                            <Link to="/stock" className="text-orange-600 dark:text-orange-400 text-sm font-bold shrink-0">Ver</Link>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-2">
                        <h3 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Ações Rápidas</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => navigate('/orders/new')} className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-primary p-6 text-center shadow-md hover:bg-blue-600 transition-colors group"><div className="bg-white/20 p-3 rounded-full group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-white text-3xl">add_shopping_cart</span></div><span className="text-white text-base font-bold">Novo Pedido</span></button>
                            <button onClick={() => navigate('/finance/new')} className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-800 p-6 text-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"><div className="bg-primary/10 p-3 rounded-full group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-primary text-3xl">receipt_long</span></div><span className="text-[#111418] dark:text-white text-base font-bold">Nova Movimentação</span></button>
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className="flex flex-col gap-0 pt-2 pb-6">
                        <div className="flex items-center justify-between pb-3"><h3 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Histórico Recente</h3></div>
                        <div className="flex flex-col bg-white dark:bg-[#1a222d] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                            {transactions.length > 0 ? (
                                transactions.slice(0, 10).map((tx, index) => (
                                    <TransactionItem key={tx.id} transaction={tx} onClick={() => handleTransactionClick(tx)} />
                                ))
                            ) : (
                                <div className="text-center text-gray-500 py-8">Nenhuma movimentação recente.</div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

const TransactionItem: React.FC<{ transaction: Transaction; onClick?: () => void }> = ({ transaction, onClick }) => (
    <div onClick={onClick} className="flex items-center gap-4 px-4 py-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#232c38] transition-colors cursor-pointer group">
        <div className={`flex items-center justify-center rounded-lg shrink-0 size-12 transition-colors ${transaction.type === TransactionType.Receita ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'}`}>
            <span className="material-symbols-outlined">{transaction.icon || (transaction.type === TransactionType.Receita ? 'trending_up' : 'trending_down')}</span>
        </div>
        <div className="flex flex-col flex-1 justify-center"><p className="text-[#111418] dark:text-white text-base font-medium leading-normal line-clamp-1">{transaction.description}</p><p className="text-[#637288] dark:text-gray-400 text-sm font-normal leading-normal">{transaction.clientName} • {transaction.date}</p></div>
        <div className="shrink-0 text-right">
            <p className={`${transaction.type === TransactionType.Receita ? 'text-green-600' : 'text-red-600'} text-base font-bold leading-normal`}>
                {transaction.type === TransactionType.Receita ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${transaction.paid ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>{transaction.paid ? 'Pago' : 'Pendente'}</span>
        </div>
    </div>
);

export default DashboardScreen;