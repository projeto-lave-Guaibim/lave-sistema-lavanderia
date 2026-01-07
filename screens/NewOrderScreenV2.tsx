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

    const calculateTotal = () => {
        return orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    };

    const handleSubmit = async () => {
        if (!selectedClient) {
            alert('Selecione um cliente');
            return;
        }

        if (orderItems.length === 0) {
            alert('Adicione pelo menos um serviço');
            return;
        }

        setSubmitting(true);

        try {
            const total = calculateTotal();
            
            // Create order
            const newOrder = await orderService.create({
                id: 0,
                client: selectedClient,
                service: `${orderItems.length} serviço(s)`, // Summary
                details: details || 'Pedido com múltiplos serviços',
                status: OrderStatus.Pendente,
                value: total,
                timestamp: new Date().toISOString(),
                extras: [],
                discount: 0
            });

            // Create order items
            const itemsToCreate = orderItems.map(item => ({
                ...item,
                order_id: newOrder.id
            }));

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
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
            </div>
        );
    }

    return (
        <>
            <Header 
                title="Novo Pedido (Múltiplos Serviços)" 
                onMenuClick={toggleSidebar}
                rightActions={
                    <button
                        onClick={() => navigate('/orders')}
                        className="flex items-center justify-center size-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                }
            />

            <main className="flex-1 overflow-y-auto p-4 pb-24 bg-background-light dark:bg-background-dark">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Client Selection */}
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Cliente</h3>
                        <select
                            value={selectedClient?.id || ''}
                            onChange={(e) => {
                                const client = clients.find(c => c.id === e.target.value);
                                setSelectedClient(client || null);
                            }}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                        >
                            <option value="">Selecione um cliente...</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <OrderItemInput 
                            items={orderItems}
                            onChange={setOrderItems}
                        />
                    </div>

                    {/* Details */}
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Observações</h3>
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-primary focus:border-primary resize-none"
                            rows={3}
                            placeholder="Observações sobre o pedido..."
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                            <span className="text-2xl font-bold text-primary">
                                R$ {calculateTotal().toFixed(2)}
                            </span>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !selectedClient || orderItems.length === 0}
                            className="w-full h-14 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    <span>Criando Pedido...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">check</span>
                                    <span>Criar Pedido</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </>
    );
};
