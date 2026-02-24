import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Client, OrderItem, OrderStatus } from '../types';
import Header from '../components/Header';
import { OrderItemInput } from '../components/OrderItemInput';
import { clientService } from '../services/clientService';
import { orderService } from '../services/orderService';
import { orderItemService } from '../services/orderItemService';

export const NewOrderScreenV2: React.FC = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const data = await clientService.getAll();
            setClients(data.filter(c => !c.isHidden).sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error('Failed to load clients', error);
            alert('Erro ao carregar clientes');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    const handleSubmit = async () => {
        if (!selectedClient) { alert('Selecione um cliente'); return; }
        if (orderItems.length === 0) { alert('Adicione pelo menos um serviço'); return; }

        setSubmitting(true);
        try {
            const total = calculateTotal();
            const newOrder = await orderService.create({
                id: 0,
                client: selectedClient,
                service: `${orderItems.length} serviço(s)`,
                details: details || 'Pedido com múltiplos serviços',
                status: OrderStatus.Pendente,
                value: total,
                timestamp: new Date().toISOString(),
                extras: [],
                discount: 0
            });

            const itemsToCreate = orderItems.map(item => ({ ...item, order_id: newOrder.id }));
            await orderItemService.createMany(itemsToCreate);

            alert('Pedido criado com sucesso!');
            navigate(`/orders/${newOrder.id}`);
        } catch (error) {
            console.error('Failed to create order', error);
            alert('Erro ao criar pedido');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
            </div>
        );
    }

    return (
        <>
            <Header 
                title="Novo Pedido" 
                onMenuClick={toggleSidebar}
                rightActions={
                    <button
                        onClick={() => navigate('/orders')}
                        className="flex items-center justify-center w-8 h-8 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                }
            />

            <main className="flex-1 overflow-y-auto p-3 pb-24 bg-[#eef0f3] dark:bg-[#111821]">
                <div className="max-w-4xl mx-auto space-y-3">

                    {/* Client Selection */}
                    <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                        <div className="flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e2a38] px-3 py-1.5">
                            <span className="material-symbols-outlined text-primary text-[14px]">person</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Cliente</span>
                        </div>
                        <div className="p-3">
                            <select
                                value={selectedClient?.id || ''}
                                onChange={(e) => {
                                    const client = clients.find(c => c.id === e.target.value);
                                    setSelectedClient(client || null);
                                }}
                                className="w-full h-8 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary"
                            >
                                <option value="">Selecione um cliente...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                        <div className="flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e2a38] px-3 py-1.5">
                            <span className="material-symbols-outlined text-primary text-[14px]">local_laundry_service</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Serviços</span>
                        </div>
                        <div className="p-3">
                            <OrderItemInput 
                                items={orderItems}
                                onChange={setOrderItems}
                            />
                        </div>
                    </div>

                    {/* Observations */}
                    <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                        <div className="flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e2a38] px-3 py-1.5">
                            <span className="material-symbols-outlined text-primary text-[14px]">notes</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Observações</span>
                        </div>
                        <div className="p-3">
                            <textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                className="w-full rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                                rows={2}
                                placeholder="Observações sobre o pedido..."
                            />
                        </div>
                    </div>

                    {/* Total + Submit */}
                    <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Total do Pedido:</span>
                            <span className="text-base font-bold text-primary">
                                R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="p-3">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !selectedClient || orderItems.length === 0}
                                className="w-full h-9 rounded bg-primary text-white font-bold text-xs hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                            >
                                {submitting ? (
                                    <><span className="material-symbols-outlined animate-spin text-[15px]">progress_activity</span> Criando Pedido...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-[15px]">check</span> Criar Pedido</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};
