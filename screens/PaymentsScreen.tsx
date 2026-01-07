import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Order, OrderStatus, Transaction, TransactionType } from '../types';
import Header from '../components/Header';
import { orderService } from '../services/orderService';
import { financeService } from '../services/financeService';
import { FeeConfigModal } from '../components/FeeConfigModal';
import { RecalculatePaymentsButton } from '../components/RecalculatePaymentsButton';
import { feeUtils } from '../utils/feeUtils';

type PaymentItem = {
    id: string;
    type: 'order' | 'finance';
    date: Date;
    description: string;
    clientName: string;
    amount: number;
    method?: string;
    fee?: number;
    netValue?: number;
    feePercentage?: number;
    transactionType?: TransactionType;
    originalData: Order | Transaction;
};

export const PaymentsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const [payments, setPayments] = useState<PaymentItem[]>([]);
    const [filteredPayments, setFilteredPayments] = useState<PaymentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMethod, setFilterMethod] = useState<string>('all');
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    useEffect(() => {
        fetchPayments();
        
        // Refresh when user comes back to this screen
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchPayments();
            }
        };
        
        const handleFocus = () => {
            fetchPayments();
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const fetchPayments = async () => {
        try {
            const [allOrders, financeTransactions] = await Promise.all([
                orderService.getAll(),
                financeService.getAll()
            ]);
            
            // Convert paid orders to PaymentItems
            const orderPayments: PaymentItem[] = allOrders
                .filter(order => order.isPaid && order.payment_method)
                .map(order => ({
                    id: `order-${order.id}`,
                    type: 'order' as const,
                    date: order.payment_date ? new Date(order.payment_date) : new Date(order.timestamp),
                    description: `Pedido #${order.id}`,
                    clientName: order.client.name,
                    amount: order.value,
                    method: order.payment_method,
                    fee: order.fee,
                    netValue: order.netValue,
                    feePercentage: order.feePercentage,
                    originalData: order
                }));
            
            // Convert finance transactions to PaymentItems
            const financePayments: PaymentItem[] = financeTransactions.map(tx => {
                let dateObj: Date;
                if (tx.date.includes('/')) {
                    // DD/MM/YYYY format
                    const [d, m, y] = tx.date.split('/').map(Number);
                    dateObj = new Date(y, m - 1, d);
                } else {
                    // YYYY-MM-DD format (ISO) - parse without timezone issues
                    const [y, m, d] = tx.date.split('-').map(Number);
                    dateObj = new Date(y, m - 1, d);
                }
                
                return {
                    id: `finance-${tx.id}`,
                    type: 'finance' as const,
                    date: dateObj,
                    description: tx.description,
                    clientName: tx.clientName || '-',
                    amount: tx.amount,
                    transactionType: tx.type,
                    originalData: tx
                };
            });
            
            // Merge and sort by date
            const allPayments = [...orderPayments, ...financePayments]
                .sort((a, b) => b.date.getTime() - a.date.getTime());
            
            setPayments(allPayments);
        } catch (error: any) {
            console.error("Failed to fetch payments", error);
            alert("Erro ao carregar pagamentos: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = payments;
        
        if (searchTerm) {
            filtered = filtered.filter(payment => 
                payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.id.includes(searchTerm)
            );
        }
        
        if (filterMethod !== 'all') {
            if (filterMethod === 'Receita' || filterMethod === 'Despesa') {
                // Filter by transaction type
                filtered = filtered.filter(payment => 
                    payment.type === 'finance' && payment.transactionType === (filterMethod as TransactionType)
                );
            } else {
                // Filter by payment method (orders only)
                filtered = filtered.filter(payment => 
                    payment.type === 'order' && payment.method?.includes(filterMethod)
                );
            }
        }
        
        setFilteredPayments(filtered);
    }, [payments, searchTerm, filterMethod]);

    const handleDeleteFinance = async (transactionId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta movimentação?')) return;
        
        try {
            await financeService.delete(transactionId);
            fetchPayments();
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('pt-BR');
    };

    const getPaymentMethodIcon = (method: string) => {
        if (method.includes('Pix')) return '💳';
        if (method.includes('Crédito')) return '💳';
        if (method.includes('Débito')) return '💳';
        if (method.includes('Dinheiro')) return '💵';
        return '💰';
    };

    return (
        <>
            <Header 
                title="Pagamentos" 
                onMenuClick={toggleSidebar}
                showSearch
                onSearch={setSearchTerm}
                rightActions={
                    <>
                        <button 
                            onClick={() => navigate('/finance/new')}
                            className="flex items-center justify-center size-10 rounded-full bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-colors"
                            title="Nova Movimentação"
                        >
                            <span className="material-symbols-outlined">add</span>
                        </button>
                        <button 
                            onClick={() => setShowFeeModal(true)}
                            className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                            title="Configurar Taxas"
                        >
                            <span className="material-symbols-outlined">percent</span>
                        </button>
                    </>
                }
            />
            
            <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar items-center bg-white dark:bg-[#111821] shadow-sm z-10 border-b border-gray-100 dark:border-gray-800">
                {[
                    { label: 'Todos', value: 'all' },
                    { label: 'Receita', value: 'Receita' },
                    { label: 'Despesa', value: 'Despesa' },
                    { label: 'Pix', value: 'Pix' },
                    { label: 'Crédito', value: 'Crédito' },
                    { label: 'Débito', value: 'Débito' },
                    { label: 'Dinheiro', value: 'Dinheiro' }
                ].map(filter => (
                    <button 
                        key={filter.value} 
                        onClick={() => setFilterMethod(filter.value)} 
                        className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-colors ${filterMethod === filter.value ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[#111418] dark:text-gray-300'}`}
                    >
                        <p className="text-sm font-medium leading-normal">{filter.label}</p>
                    </button>
                ))}
            </div>

            <main className="flex-1 overflow-y-auto no-scrollbar bg-background-light dark:bg-background-dark p-4 pb-24">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">
                        <span className="material-symbols-outlined text-6xl mb-4 block">payments</span>
                        <p className="font-bold">Nenhum pagamento encontrado</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredPayments.map((payment) => {
                            if (payment.type === 'order') {
                                // Render Order Payment
                                const order = payment.originalData as Order;
                                return (
                                    <div 
                                        key={payment.id}
                                        onClick={() => navigate(`/orders/${order.id}`)}
                                        className="bg-white dark:bg-[#1a222d] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-2xl">{getPaymentMethodIcon(payment.method || '')}</span>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#111418] dark:text-white">
                                                            {payment.description}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {payment.date.toLocaleDateString('pt-BR')} às {payment.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{payment.clientName}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 mb-1">
                                                    {payment.method}
                                                    {payment.feePercentage && payment.feePercentage > 0 && <span className="text-orange-500"> ({payment.feePercentage}%)</span>}
                                                </p>
                                                <p className="text-lg font-bold text-primary">R$ {(payment.netValue || payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                                            <div>
                                                <p className="text-xs text-gray-500">Valor Total</p>
                                                <p className="text-sm font-semibold text-[#111418] dark:text-white">R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            {payment.fee && payment.fee > 0 && (
                                                <div>
                                                    <p className="text-xs text-gray-500">Taxa ({payment.feePercentage}%)</p>
                                                    <p className="text-sm font-semibold text-red-500">- R$ {payment.fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-xs text-gray-500">Líquido</p>
                                                <p className="text-sm font-semibold text-green-600">R$ {(payment.netValue || payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-xs text-gray-500">{order.service}</span>
                                            <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
                                        </div>
                                    </div>
                                );
                            } else {
                                // Render Finance Transaction
                                const transaction = payment.originalData as Transaction;
                                const isReceita = payment.transactionType === TransactionType.Receita;
                                
                                return (
                                    <div 
                                        key={payment.id}
                                        className="bg-white dark:bg-[#1a222d] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow relative"
                                    >
                                        {/* Discreet action buttons in corner */}
                                        <div className="absolute top-3 right-3 flex gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/finance/edit/${transaction.id}`);
                                                }}
                                                className="size-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-500 transition-colors opacity-60 hover:opacity-100"
                                                title="Editar movimentação"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteFinance(transaction.id);
                                                }}
                                                className="size-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-500 transition-colors opacity-60 hover:opacity-100"
                                                title="Excluir movimentação"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-start mb-3 pr-16">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`size-10 rounded-full flex items-center justify-center ${isReceita ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                                                        <span className={`material-symbols-outlined ${isReceita ? 'text-green-600' : 'text-red-600'}`}>
                                                            {isReceita ? 'trending_up' : 'trending_down'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#111418] dark:text-white">
                                                            {payment.description}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {payment.date.toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 ml-12">
                                                    {isReceita ? 'Receita' : 'Despesa'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-lg font-bold ${isReceita ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isReceita ? '+' : '-'} R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        })}
                    </div>
                )}
            </main>
            
            {showFeeModal && (
                <FeeConfigModal 
                    onClose={() => setShowFeeModal(false)}
                    onSave={() => {
                        // Refresh payments to recalculate with new fees if needed
                        fetchPayments();
                    }}
                />
            )}
        </>
    );
};
