import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Order, OrderStatus } from '../types';
import Header from '../components/Header';
import { orderService } from '../services/orderService';
import { FeeConfigModal } from '../components/FeeConfigModal';
import { feeUtils } from '../utils/feeUtils';

export const PaymentsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const [payments, setPayments] = useState<Order[]>([]);
    const [filteredPayments, setFilteredPayments] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMethod, setFilterMethod] = useState<string>('all');
    const [showFeeModal, setShowFeeModal] = useState(false);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const allOrders = await orderService.getAll();
            // Filter only paid orders
            const paidOrders = allOrders.filter(order => order.isPaid && order.payment_method);
            // Sort by date (most recent first)
            paidOrders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setPayments(paidOrders);
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
                payment.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.id.toString().includes(searchTerm)
            );
        }
        
        if (filterMethod !== 'all') {
            filtered = filtered.filter(payment => payment.payment_method?.includes(filterMethod));
        }
        
        setFilteredPayments(filtered);
    }, [payments, searchTerm, filterMethod]);

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
                    <button 
                        onClick={() => setShowFeeModal(true)}
                        className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                        title="Configurar Taxas"
                    >
                        <span className="material-symbols-outlined">percent</span>
                    </button>
                }
            />
            
            <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar items-center bg-white dark:bg-[#111821] shadow-sm z-10 border-b border-gray-100 dark:border-gray-800">
                {[
                    { label: 'Todos', value: 'all' },
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
                            const fee = payment.fee || 0;
                            const netValue = payment.netValue || payment.value;
                            const paymentDate = payment.payment_date ? new Date(payment.payment_date) : new Date(payment.timestamp);
                            const feePercentage = payment.feePercentage || 0;
                            
                            return (
                                <div 
                                    key={payment.id}
                                    onClick={() => navigate(`/orders/${payment.id}`)}
                                    className="bg-white dark:bg-[#1a222d] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-2xl">{getPaymentMethodIcon(payment.payment_method || '')}</span>
                                                <div>
                                                    <p className="text-sm font-bold text-[#111418] dark:text-white">
                                                        Pedido #{payment.id}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {paymentDate.toLocaleDateString('pt-BR')} às {paymentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{payment.client.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 mb-1">
                                                {payment.payment_method}
                                                {feePercentage > 0 && <span className="text-orange-500"> ({feePercentage}%)</span>}
                                            </p>
                                            <p className="text-lg font-bold text-primary">R$ {netValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                                        <div>
                                            <p className="text-xs text-gray-500">Valor Total</p>
                                            <p className="text-sm font-semibold text-[#111418] dark:text-white">R$ {payment.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        {fee > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-500">Taxa ({feePercentage}%)</p>
                                                <p className="text-sm font-semibold text-red-500">- R$ {fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-xs text-gray-500">Líquido</p>
                                            <p className="text-sm font-semibold text-green-600">R$ {netValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-xs text-gray-500">{payment.service}</span>
                                        <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
                                    </div>
                                </div>
                            );
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
