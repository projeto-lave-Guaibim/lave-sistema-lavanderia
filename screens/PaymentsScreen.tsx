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
            
            <div className="flex gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar items-center bg-white dark:bg-[#111821] border-b border-gray-200 dark:border-gray-700">
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
                        className={`flex h-7 shrink-0 items-center px-3 rounded transition-colors text-xs font-semibold ${
                            filterMethod === filter.value
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            <main className="flex-1 overflow-y-auto no-scrollbar bg-background-light dark:bg-background-dark p-3 pb-24">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">
                        <span className="material-symbols-outlined text-4xl mb-2 block">payments</span>
                        <p className="text-xs font-semibold">Nenhum pagamento encontrado</p>
                    </div>
                ) : (
                    <div className="flex flex-col rounded border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-[#1a222d]">
                        {filteredPayments.map((payment, idx) => {
                            if (payment.type === 'order') {
                                const order = payment.originalData as Order;
                                return (
                                    <div
                                        key={payment.id}
                                        onClick={() => navigate(`/orders/${order.id}`)}
                                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-[#232c38] transition-colors ${
                                            idx < filteredPayments.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                                        }`}
                                    >
                                        <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                                            <span className="text-green-600 text-[12px]">{getPaymentMethodIcon(payment.method || '')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-800 dark:text-white line-clamp-1">{payment.description} — {payment.clientName}</p>
                                            <p className="text-[10px] text-gray-400">{payment.date.toLocaleDateString('pt-BR')} · {payment.method}
                                                {payment.feePercentage && payment.feePercentage > 0 && <span className="text-orange-500"> ({payment.feePercentage}%)</span>}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-xs font-bold text-primary">R$ {(payment.netValue || payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            {payment.fee && payment.fee > 0 && <p className="text-[10px] text-red-500">-{payment.fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}
                                        </div>
                                        <span className="material-symbols-outlined text-gray-300 text-[14px]">chevron_right</span>
                                    </div>
                                );
                            } else {
                                // Render Finance Transaction
                                const transaction = payment.originalData as Transaction;
                                const isReceita = payment.transactionType === TransactionType.Receita;
                                return (
                                    <div
                                        key={payment.id}
                                        className={`flex items-center gap-3 px-3 py-2 relative hover:bg-blue-50 dark:hover:bg-[#232c38] transition-colors ${
                                            idx < filteredPayments.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                                        }`}
                                    >
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                            isReceita ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                                        }`}>
                                            <span className={`material-symbols-outlined text-[14px] ${
                                                isReceita ? 'text-green-600' : 'text-red-500'
                                            }`}>{isReceita ? 'trending_up' : 'trending_down'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-800 dark:text-white line-clamp-1">{payment.description}</p>
                                            <p className="text-[10px] text-gray-400">{payment.date.toLocaleDateString('pt-BR')} · {isReceita ? 'Receita' : 'Despesa'}</p>
                                        </div>
                                        <p className={`text-xs font-bold shrink-0 ${
                                            isReceita ? 'text-green-600' : 'text-red-500'
                                        }`}>{isReceita ? '+' : '-'} R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        <div className="flex gap-0.5 shrink-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/finance/edit/${transaction.id}`); }}
                                                className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                title="Editar"
                                            >
                                                <span className="material-symbols-outlined text-[13px]">edit</span>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteFinance(transaction.id); }}
                                                className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                title="Excluir"
                                            >
                                                <span className="material-symbols-outlined text-[13px]">delete</span>
                                            </button>
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
