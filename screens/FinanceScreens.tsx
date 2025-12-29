import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Transaction, TransactionType, Order, OrderStatus } from '../types';
import Header from '../components/Header';
import { financeService } from '../services/financeService';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';

export const CashFlowScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Receitas' | 'Despesas'>('Receitas');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showAll, setShowAll] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const { user: currentUser } = useAuth();

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este registro?')) return;
        try {
            await financeService.delete(id);
            setTransactions(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error("Failed to delete transaction", error);
            alert("Erro ao excluir registro.");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [txData, ordersData] = await Promise.all([
                    financeService.getAll(),
                    orderService.getAll()
                ]);
                setTransactions(txData);
                setOrders(ordersData);
            } catch (error) {
                console.error("Failed to fetch finance data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePreviousMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    };

    const formattedDate = ((date) => {
        const str = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        return str.charAt(0).toUpperCase() + str.slice(1);
    })(currentDate);

    // Merge Transactions and Orders
    const allItems = useMemo(() => {
        const orderTransactions: Transaction[] = orders.map(order => {
            // Parse timestamp "DD/MM/YYYY, HH:mm:ss" to YYYY-MM-DD for consistency if needed, 
            // or just use the date part. The filter logic below handles date objects.
            // Let's assume order.timestamp is "DD/MM/YYYY..." string.
            // We need a standard date string YYYY-MM-DD for the Transaction interface if we want to be strict,
            // but the filter logic parses it.
            
            // Extract date part from "DD/MM/YYYY, HH:mm:ss" -> "DD/MM/YYYY"
            const datePart = order.timestamp.split(',')[0].trim(); 
            
            return {
                id: `order-${order.id}`, // Use string ID to match Transaction interface
                type: TransactionType.Receita,
                description: `Pedido #${order.id} - ${order.service}`,
                clientName: order.client.name,
                date: datePart,
                amount: order.value || 0,
                paid: order.status === OrderStatus.Entregue,
                icon: 'local_laundry_service'
            };
        });
        return [...transactions, ...orderTransactions];
    }, [transactions, orders]);

    // Filter transactions by month and year
    const monthlyTransactions = useMemo(() => {
        return allItems.filter(tx => {
            let dateObj: Date;
            if (tx.date.includes('/')) {
                const [day, month, year] = tx.date.split('/').map(Number);
                dateObj = new Date(year, month - 1, day);
            } else {
                dateObj = new Date(tx.date);
                dateObj = new Date(dateObj.valueOf() + dateObj.getTimezoneOffset() * 60000);
            }
            
            return dateObj.getMonth() === currentDate.getMonth() && dateObj.getFullYear() === currentDate.getFullYear();
        });
    }, [currentDate, allItems]);

    // Filter by active tab (Receitas/Despesas)
    const filteredTransactions = useMemo(() => {
        const typeFiltered = monthlyTransactions.filter(tx => {
            if (activeTab === 'Receitas') return tx.type === TransactionType.Receita;
            return tx.type === TransactionType.Despesa;
        });
        
        return showAll ? typeFiltered : typeFiltered.slice(0, 3);
    }, [monthlyTransactions, activeTab, showAll]);

    // Calculate totals
    const totals = useMemo(() => {
        const income = monthlyTransactions
            .filter(tx => tx.type === TransactionType.Receita && tx.paid)
            .reduce((acc, curr) => acc + curr.amount, 0);
            
        const projectedIncome = monthlyTransactions
            .filter(tx => tx.type === TransactionType.Receita && !tx.paid)
            .reduce((acc, curr) => acc + curr.amount, 0);

        const expense = monthlyTransactions
            .filter(tx => tx.type === TransactionType.Despesa)
            .reduce((acc, curr) => acc + curr.amount, 0);
            
        return {
            income,
            projectedIncome,
            expense,
            profit: income - expense
        };
    }, [monthlyTransactions]);

    return (
        <>
            <Header 
                title="Fluxo de Caixa" 
                onMenuClick={toggleSidebar}
            />
            <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
                <div className="bg-white dark:bg-[#1a222d] px-4 py-3 sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center justify-between bg-[#f0f2f4] dark:bg-[#232c38] rounded-lg p-1">
                        <button onClick={handlePreviousMonth} className="p-2 hover:bg-white dark:hover:bg-[#2a3441] rounded-md transition-all"><span className="material-symbols-outlined text-gray-500">chevron_left</span></button>
                        <div className="flex items-center gap-2 cursor-pointer"><span className="material-symbols-outlined text-primary">calendar_month</span><span className="text-sm font-bold text-[#111418] dark:text-white">{formattedDate}</span></div>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-white dark:hover:bg-[#2a3441] rounded-md transition-all"><span className="material-symbols-outlined text-gray-500">chevron_right</span></button>
                    </div>
                </div>
                <div className="p-4 flex flex-col gap-4">
                    <div className="bg-primary rounded-xl p-6 text-white shadow-lg shadow-blue-200 dark:shadow-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><span className="material-symbols-outlined" style={{ fontSize: '96px' }}>account_balance_wallet</span></div>
                        <p className="text-blue-100 text-sm font-medium mb-1">Lucro Líquido (Realizado)</p>
                        <div className="flex items-baseline gap-1"><span className="text-3xl font-bold tracking-tight">R$ {totals.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        {totals.projectedIncome > 0 && (
                            <div className="mt-4 flex items-center gap-2 text-xs bg-white/20 w-fit px-3 py-1.5 rounded-full text-white">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>pending</span>
                                <span>+ R$ {totals.projectedIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} a receber</span>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-[#1a222d] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-3"><div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg text-success"><span className="material-symbols-outlined">arrow_downward</span></div><span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase">Receitas</span></div>
                            <p className="text-[#111418] dark:text-white text-lg font-bold">R$ {totals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <p className="text-xs text-gray-400 mt-1">Confirmadas</p>
                        </div>
                        <div className="bg-white dark:bg-[#1a222d] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-3"><div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-lg text-danger"><span className="material-symbols-outlined">arrow_upward</span></div><span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase">Despesas</span></div>
                            <p className="text-[#111418] dark:text-white text-lg font-bold">R$ {totals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <p className="text-xs text-gray-400 mt-1">Total</p>
                        </div>
                    </div>
                </div>
                <div className="sticky top-[64px] z-0 bg-background-light dark:bg-background-dark pt-2">
                    <div className="flex border-b border-[#dce0e5] dark:border-[#2a3441] px-4 justify-between bg-white dark:bg-[#1a222d] rounded-t-xl mx-2 shadow-sm">
                        <button onClick={() => setActiveTab('Receitas')} className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-4 flex-1 transition-colors ${activeTab === 'Receitas' ? 'border-b-primary text-primary' : 'border-b-transparent text-[#637288] dark:text-gray-400'}`}><p className="text-sm font-bold">Receitas</p></button>
                        <button onClick={() => setActiveTab('Despesas')} className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-4 flex-1 transition-colors ${activeTab === 'Despesas' ? 'border-b-primary text-primary' : 'border-b-transparent text-[#637288] dark:text-gray-400'}`}><p className="text-sm font-bold">Despesas</p></button>
                    </div>
                </div>
                <div className="flex flex-col bg-white dark:bg-[#1a222d] mx-2 mb-4 rounded-b-xl shadow-sm min-h-[300px]">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-xs font-medium text-gray-500 uppercase">Últimas movimentações</span>
                        <button onClick={() => setShowAll(!showAll)} className="text-xs font-medium text-primary cursor-pointer hover:underline">
                            {showAll ? 'Ver menos' : 'Ver tudo'}
                        </button>
                    </div>
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                        </div>
                    ) : filteredTransactions.length > 0 ? (
                        filteredTransactions.map(tx => (
                            <TransactionItem 
                                key={tx.id} 
                                transaction={tx} 
                                isAdmin={currentUser?.role === 'admin'}
                                onDelete={() => handleDelete(tx.id)}
                            />
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                            Nenhuma movimentação encontrada para este período.
                        </div>
                    )}
                </div>
            </main>
            <button onClick={() => navigate('/finance/new')} className="fixed bottom-[90px] right-4 bg-primary hover:bg-primary-dark text-white rounded-full size-14 shadow-lg shadow-blue-500/40 flex items-center justify-center transition-all transform hover:scale-105 z-20"><span className="material-symbols-outlined">add</span></button>
        </>
    );
};

const TransactionItem: React.FC<{ transaction: Transaction; isAdmin?: boolean; onDelete?: () => void }> = ({ transaction, isAdmin, onDelete }) => (
    <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#232c38] transition-colors cursor-pointer group relative">
        <div className="flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-primary shrink-0 size-12 group-hover:bg-primary group-hover:text-white transition-colors"><span className="material-symbols-outlined">{transaction.icon}</span></div>
        <div className="flex flex-col flex-1 justify-center"><p className="text-[#111418] dark:text-white text-base font-medium leading-normal line-clamp-1">{transaction.description}</p><p className="text-[#637288] dark:text-gray-400 text-sm font-normal leading-normal">{transaction.clientName} • {transaction.date}</p></div>
        <div className="shrink-0 text-right flex items-center gap-3">
            <div>
                <p className="text-success text-base font-bold leading-normal">+ R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${transaction.paid ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>{transaction.paid ? 'Pago' : 'Pendente'}</span>
            </div>
            {isAdmin && onDelete && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="size-8 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                    title="Excluir"
                >
                    <span className="material-symbols-outlined text-lg">delete</span>
                </button>
            )}
        </div>
    </div>
);


export const AddTransactionScreen: React.FC = () => {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        type: 'receita',
        description: '',
        amount: '',
        date: today
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await financeService.create({
                type: formData.type === 'receita' ? TransactionType.Receita : TransactionType.Despesa,
                description: formData.description,
                amount: parseFloat(formData.amount.replace(',', '.')),
                date: formData.date,
                clientName: 'Avulso', // Default for now
                paid: true,
                icon: formData.type === 'receita' ? 'attach_money' : 'money_off'
            });
            navigate('/finance');

        } catch (error: any) {
            console.error("Failed to create transaction", error);
            alert(`Erro ao salvar transação: ${error.message || JSON.stringify(error)}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <header className="flex items-center bg-surface-light dark:bg-surface-dark px-4 py-4 justify-between border-b border-gray-200 dark:border-gray-800 shrink-0 z-20">
                <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#111418] dark:text-white"><span className="material-symbols-outlined text-2xl">close</span></button>
                <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Adicionar Receita/Despesa</h2>
                <button className="flex h-10 items-center justify-end px-2"><p className="text-[#637288] dark:text-gray-400 text-base font-bold leading-normal tracking-[0.015em] shrink-0">Limpar</p></button>
            </header>
            <main className="flex-1 overflow-y-auto pb-28 no-scrollbar bg-background-light dark:bg-background-dark">
                <div className="pt-6 px-4"><h3 className="text-[#111418] dark:text-white tracking-light text-xl font-bold leading-tight pb-3">Tipo</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <label className="cursor-pointer"><input defaultChecked={true} className="peer sr-only" name="type" type="radio" value="receita" onChange={handleChange} /><div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-surface-light dark:bg-surface-dark border-2 border-gray-200 dark:border-gray-700 h-24 text-gray-600 dark:text-gray-300 transition-all peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary shadow-sm"><span className="material-symbols-outlined text-3xl">trending_up</span><span className="font-bold text-sm">Receita</span></div></label>
                        <label className="cursor-pointer"><input className="peer sr-only" name="type" type="radio" value="despesa" onChange={handleChange} /><div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-surface-light dark:bg-surface-dark border-2 border-gray-200 dark:border-gray-700 h-24 text-gray-600 dark:text-gray-300 transition-all peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary shadow-sm"><span className="material-symbols-outlined text-3xl">trending_down</span><span className="font-bold text-sm">Despesa</span></div></label>
                    </div>
                </div>
                <div className="pt-6 px-4"><h3 className="text-[#111418] dark:text-white tracking-light text-xl font-bold leading-tight pb-3">Descrição</h3><label className="relative flex flex-col w-full"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="material-symbols-outlined text-gray-500">description</span></div><input name="description" value={formData.description} onChange={handleChange} className="form-input w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark text-[#111418] dark:text-white h-14 pl-11 pr-4 focus:border-primary focus:ring-primary text-base font-medium shadow-sm transition-colors placeholder:text-gray-400" placeholder="Ex: Venda de produtos, Conta de luz" type="text" /></label></div>
                <div className="pt-6 px-4"><h3 className="text-[#111418] dark:text-white tracking-light text-xl font-bold leading-tight pb-3">Valor</h3><div className="relative"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><span className="text-gray-500 font-bold text-lg">R$</span></div><input name="amount" value={formData.amount} onChange={handleChange} className="form-input w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark text-[#111418] dark:text-white h-16 pl-12 pr-4 focus:border-primary focus:ring-primary text-2xl font-bold shadow-sm placeholder:text-gray-300" placeholder="0,00" step="0.01" type="number" /></div></div>
                <div className="pt-6 px-4"><h3 className="text-[#111418] dark:text-white tracking-light text-xl font-bold leading-tight pb-3">Data</h3><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="material-symbols-outlined text-gray-500">calendar_today</span></div><input name="date" value={formData.date} onChange={handleChange} className="form-input w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark text-[#111418] dark:text-white h-14 pl-11 pr-4 focus:border-primary focus:ring-primary text-base font-medium shadow-sm" type="date" /></div></div>
                <div className="mt-8 px-4 pb-4"><button onClick={handleSubmit} disabled={submitting} className="w-full rounded-xl bg-primary h-14 text-white text-lg font-bold shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"><span className="material-symbols-outlined">check</span>{submitting ? 'Salvando...' : 'Salvar'}</button></div>
            </main>
        </>
    );
};
