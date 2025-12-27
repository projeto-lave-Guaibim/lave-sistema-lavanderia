import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { Order, OrderStatus, Client } from '../types';
import Header from '../components/Header';
import { openWhatsApp } from '../utils/whatsappUtils';
import { orderService } from '../services/orderService';
import { clientService } from '../services/clientService';

export const OrdersListScreen: React.FC = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [activeCategoryFilter, setActiveCategoryFilter] = useState('Todas');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await orderService.getAll();
                setOrders(data);
            } catch (error) {
                console.error("Failed to fetch orders", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const filters = ['Todos', 'Pendente', 'Lavando', 'Pronto', 'Entregue'];

    const filteredOrders = orders.filter(order => {
        const matchesStatus = activeFilter === 'Todos' || order.status === activeFilter;
        const matchesCategory = activeCategoryFilter === 'Todas' || order.service === activeCategoryFilter;
        return matchesStatus && matchesCategory;
    });

    // Get unique services for filter
    const services = Array.from(new Set(orders.map(o => o.service))).filter(Boolean).sort();

    const getStatusColor = (status: string) => {
        switch (status) {
            case OrderStatus.Pendente: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case OrderStatus.Lavando: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case OrderStatus.Pronto: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case OrderStatus.Entregue: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <>
            <Header 
                title="Pedidos" 
                onMenuClick={toggleSidebar}
                rightActions={
                    <div className="flex items-center gap-2">
                        <select 
                            value={activeCategoryFilter}
                            onChange={(e) => setActiveCategoryFilter(e.target.value)}
                            className="bg-white dark:bg-gray-800 border-none text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                        >
                            <option value="Todas">Todas as Categorias</option>
                            {services.map(service => (
                                <option key={service} value={service}>{service}</option>
                            ))}
                        </select>
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 ring-2 ring-white dark:ring-gray-700 shadow-sm" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDmPHpIUE4i7dS3UbI0BA_gk9yiQN9Z0yJsG5-mxJAvUVyKsWC8oBO1q4hJMDbSzQXBazNDO8iksfWNSzT9VChGaOhuRS4fAAxnW8zH5smroyIX9io6EVNx_79v_a3EQhLaPgbtX4o8eJ89svXZp1NXGkM36DXNbeBHw_2k52jGTgZhS4TvNu8m71ujnClsidaHfX86yz97Jv6BJlYS7zG7l9tHqk8_Du8_VLo-9H2G7XCouSi1g1ryzaVTJ7Ks8-SxRub7LwWl5GKa")` }}></div>
                    </div>
                }
            />
            <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar items-center bg-white dark:bg-[#111821] shadow-sm z-10">
                {filters.map(filter => (
                    <button key={filter} onClick={() => setActiveFilter(filter)} className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-colors ${activeFilter === filter ? 'bg-primary text-white' : 'bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                        <p className={`text-sm font-medium leading-normal ${activeFilter !== filter && 'text-[#111418] dark:text-gray-300'}`}>{filter}</p>
                    </button>
                ))}
            </div>
            <main className="flex-1 overflow-y-auto no-scrollbar p-4 pt-2 pb-24">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                    </div>
                ) : (
                    <>
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map(order => (
                                <div key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="flex items-center justify-between bg-surface-light dark:bg-surface-dark px-4 py-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 mb-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:scale-[0.99]">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-10 rounded-full ${getStatusColor(order.status).split(' ')[0]}`}></div>
                                        <div>
                                            <p className="text-[#111418] dark:text-white text-sm font-bold leading-tight">#{order.id.toString().padStart(4, '0')} • {order.client.name}</p>
                                            <p className="text-[#637288] dark:text-gray-400 text-xs font-medium">{order.service} • R$ {order.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-400 text-xl">chevron_right</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 mt-10">Nenhum pedido encontrado.</div>
                        )}
                    </>
                )}
            </main>
            <button onClick={() => navigate('/orders/new')} className="fixed bottom-[90px] right-4 bg-primary hover:bg-primary-dark text-white rounded-full size-14 shadow-lg shadow-blue-500/40 flex items-center justify-center transition-all transform hover:scale-105 z-20"><span className="material-symbols-outlined">add</span></button>
        </>
    );
};

import { catalogService } from '../services/catalogService';
import { Service, CatalogItem, Extra } from '../types';

// ... (existing imports)

export const NewOrderScreen: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [extras, setExtras] = useState<Extra[]>([]);
    
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [weight, setWeight] = useState('');
    const [selectedItems, setSelectedItems] = useState<{ item: CatalogItem; quantity: number }[]>([]);
    const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
    const [details, setDetails] = useState('');
    const [discount, setDiscount] = useState('0');

    const [kgCategory, setKgCategory] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsData, servicesData, itemsData, extrasData] = await Promise.all([
                    clientService.getAll(),
                    catalogService.getServices(),
                    catalogService.getItems(),
                    catalogService.getExtras()
                ]);
                setClients(clientsData);
                setServices(servicesData);
                setItems(itemsData);
                setExtras(extrasData);
            } catch (error) {
                console.error("Failed to fetch data", error);
                alert("Erro ao carregar dados.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleToggleExtra = (extra: Extra) => {
        if (selectedExtras.some(e => e.id === extra.id)) {
            setSelectedExtras(prev => prev.filter(e => e.id !== extra.id));
        } else {
            setSelectedExtras(prev => [...prev, extra]);
        }
    };

    const handleAddItem = (item: CatalogItem, delta: number) => {
        setSelectedItems(prev => {
            const existing = prev.find(i => i.item.id === item.id);
            if (existing) {
                const newQty = existing.quantity + delta;
                if (newQty <= 0) return prev.filter(i => i.item.id !== item.id);
                return prev.map(i => i.item.id === item.id ? { ...i, quantity: newQty } : i);
            } else if (delta > 0) {
                return [...prev, { item, quantity: 1 }];
            }
            return prev;
        });
    };

    const calculateTotal = () => {
        let total = 0;
        if (selectedService) {
            if (selectedService.type === 'kg') {
                total += (parseFloat(weight) || 0) * selectedService.price;
            } else {
                total += selectedItems.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);
            }
        }
        total += selectedExtras.reduce((acc, curr) => acc + curr.price, 0);
        const discountAmount = parseFloat(discount) || 0;
        return Math.max(0, total - discountAmount);
    };

    const handleSubmit = async () => {
        if (!selectedClient || !selectedService) return;
        
        setSubmitting(true);
        try {
            const totalValue = calculateTotal();
            const itemsDescription = selectedService.type === 'item' 
                ? selectedItems.map(i => `${i.quantity}x ${i.item.name}`).join(', ')
                : `${weight}kg${kgCategory ? ` (${kgCategory})` : ''}`;

            const extrasDescription = selectedExtras.length > 0 
                ? `Extras: ${selectedExtras.map(e => e.name).join(', ')}` 
                : '';

            const newOrder: Order = {
                id: 0,
                client: selectedClient,
                service: selectedService.name,
                details: `${itemsDescription}. ${extrasDescription} ${details}`,
                value: totalValue,
                status: OrderStatus.Pendente,
                extras: selectedExtras,
                discount: parseFloat(discount) || 0,
                timestamp: new Date().toISOString()
            };

            await orderService.create(newOrder);
            navigate('/orders');
        } catch (error: any) {
            console.error("Failed to create order", error);
            alert(`Erro ao criar pedido: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;

    return (

        <>
            <header className="flex items-center bg-surface-light dark:bg-surface-dark px-4 py-4 justify-between border-b border-gray-200 dark:border-gray-800 shrink-0 z-20">
                <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#111418] dark:text-white"><span className="material-symbols-outlined text-2xl">arrow_back</span></button>
                <div className="flex-1 flex justify-center gap-2">
                    <div className={`h-2 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    <div className={`h-2 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    <div className={`h-2 w-8 rounded-full transition-colors ${step >= 3 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    <div className={`h-2 w-8 rounded-full transition-colors ${step >= 4 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                </div>
                <div className="size-10"></div>
            </header>
            
            <main className="flex-1 overflow-y-auto pb-40 no-scrollbar bg-background-light dark:bg-background-dark p-4">
                {step === 1 && (
                    <div className="space-y-4 animate-in slide-in-from-right duration-300">
                        <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-4">Quem é o cliente?</h2>
                        <input type="text" placeholder="Buscar cliente..." className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark px-4 py-3 mb-4 focus:ring-primary focus:border-primary" />
                        {clients.map(client => (
                            <div key={client.id} onClick={() => { setSelectedClient(client); setStep(2); }} className="flex items-center gap-3 p-3 bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:scale-[0.99]">
                                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12" style={{ backgroundImage: `url("${client.avatarUrl}")` }}></div>
                                <div><p className="font-bold text-[#111418] dark:text-white text-lg">{client.name}</p><p className="text-sm text-gray-500">{client.phone}</p></div>
                                <span className="material-symbols-outlined ml-auto text-gray-400">chevron_right</span>
                            </div>
                        ))}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 animate-in slide-in-from-right duration-300">
                        <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-4">Qual o serviço?</h2>
                        <div className="grid gap-3">
                            {services.map(service => (
                                <button key={service.id} onClick={() => { setSelectedService(service); setStep(3); }} className="flex items-center gap-4 p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary transition-colors shadow-sm text-left group">
                                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors"><span className="material-symbols-outlined text-3xl">{service.icon || 'local_laundry_service'}</span></div>
                                    <div className="flex-1">
                                        <span className="block font-bold text-[#111418] dark:text-white text-lg">{service.name}</span>
                                        <span className="text-sm text-gray-500 group-hover:text-primary/80">{service.type === 'kg' ? 'Cobrado por Kg' : 'Cobrado por Peça'}</span>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-300 group-hover:text-primary">chevron_right</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && selectedService && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Serviço</p>
                                <p className="font-bold text-[#111418] dark:text-white text-lg">{selectedService.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Preço Base</p>
                                <p className="font-bold text-primary text-lg">R$ {(selectedService.price || 0).toFixed(2)}</p>
                            </div>
                        </div>

                        {selectedService.type === 'kg' ? (
                            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-gray-100 dark:border-gray-800 text-center space-y-6">
                                <div>
                                    <label className="block text-[#111418] dark:text-white text-base font-bold mb-3">O que será lavado?</label>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {['Roupas no geral', 'Cama mesa e banho', 'Cortinas', 'Outros'].map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setKgCategory(cat)}
                                                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${kgCategory === cat ? 'bg-primary text-white border-primary shadow-md shadow-primary/30' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                    {!kgCategory && <p className="text-red-500 text-xs mt-2">* Selecione uma categoria</p>}
                                </div>
                                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                                    <label className="block text-[#111418] dark:text-white text-lg font-bold">Peso Total</label>
                                    <div className="flex items-center justify-center gap-2">
                                        <input 
                                            type="number" 
                                            value={weight} 
                                            onChange={e => setWeight(e.target.value)} 
                                            className="w-32 text-center bg-transparent text-5xl font-bold text-primary border-b-2 border-primary focus:outline-none placeholder-primary/30" 
                                            placeholder="0.0" 
                                            autoFocus
                                        />
                                        <span className="text-2xl font-bold text-gray-400 mt-4">kg</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-[#111418] dark:text-white text-lg font-bold mb-3">Selecionar Peças</h3>
                                <div className="grid gap-2">
                                    {items.map(item => {
                                        const qty = selectedItems.find(i => i.item.id === item.id)?.quantity || 0;
                                        return (
                                            <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${qty > 0 ? 'bg-primary/5 border-primary/30' : 'bg-surface-light dark:bg-surface-dark border-gray-100 dark:border-gray-800'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-10 rounded-lg flex items-center justify-center ${qty > 0 ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}><span className="material-symbols-outlined">{item.icon || 'checkroom'}</span></div>
                                                    <div><p className="font-bold text-sm text-[#111418] dark:text-white">{item.name}</p><p className="text-xs text-gray-500">R$ {item.price.toFixed(2)}</p></div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {qty > 0 && <button onClick={() => handleAddItem(item, -1)} className="size-8 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300"><span className="material-symbols-outlined text-sm">remove</span></button>}
                                                    {qty > 0 && <span className="font-bold w-4 text-center text-[#111418] dark:text-white">{qty}</span>}
                                                    <button onClick={() => handleAddItem(item, 1)} className={`size-8 rounded-full flex items-center justify-center shadow-sm transition-colors ${qty > 0 ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}><span className="material-symbols-outlined text-sm">add</span></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#1a222d] border-t border-gray-100 dark:border-gray-800 z-20">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-500">Total Estimado</span>
                                <span className="text-3xl font-bold text-primary">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <button onClick={() => setStep(4)} disabled={calculateTotal() === 0 || (selectedService.type === 'kg' && !kgCategory)} className="w-full rounded-xl bg-primary h-14 text-white text-lg font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors">
                                Continuar
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-32">
                        <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-4">Serviços Extras</h2>
                        <div className="grid gap-3">
                            {extras.map(extra => {
                                const isSelected = selectedExtras.some(e => e.id === extra.id);
                                return (
                                    <div key={extra.id} onClick={() => handleToggleExtra(extra)} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-primary/5 border-primary/30' : 'bg-surface-light dark:bg-surface-dark border-gray-100 dark:border-gray-800'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`size-6 rounded-md border flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                                {isSelected && <span className="material-symbols-outlined text-sm">check</span>}
                                            </div>
                                            <span className="font-bold text-[#111418] dark:text-white">{extra.name}</span>
                                        </div>
                                        <span className="font-bold text-primary">+ R$ {extra.price.toFixed(2)}</span>
                                    </div>
                                );
                            })}
                            {extras.length === 0 && <p className="text-gray-500 text-center">Nenhum serviço extra disponível.</p>}
                        </div>

                        {/* Desconto como checkbox com valor editável */}
                        <div className="grid gap-3">
                            <div className={`flex items-center justify-between p-4 rounded-xl border ${parseFloat(discount) > 0 ? 'bg-danger/5 border-danger/30' : 'bg-surface-light dark:bg-surface-dark border-gray-100 dark:border-gray-800'}`}>
                                <div className="flex items-center gap-3 flex-1">
                                    <div 
                                        onClick={() => setDiscount(parseFloat(discount) > 0 ? '0' : '10')}
                                        className={`size-6 rounded-md border flex items-center justify-center cursor-pointer ${parseFloat(discount) > 0 ? 'bg-danger border-danger text-white' : 'border-gray-300 dark:border-gray-600'}`}
                                    >
                                        {parseFloat(discount) > 0 && <span className="material-symbols-outlined text-sm">check</span>}
                                    </div>
                                    <span className="font-bold text-[#111418] dark:text-white">Desconto</span>
                                </div>
                                {parseFloat(discount) > 0 && (
                                    <input 
                                        type="number" 
                                        value={discount} 
                                        onChange={e => setDiscount(e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                        className="w-28 rounded-lg border border-danger/30 bg-white dark:bg-surface-dark px-3 py-1 text-right font-bold text-danger focus:ring-danger focus:border-danger" 
                                        placeholder="0,00"
                                        step="0.01"
                                        min="0"
                                    />
                                )}
                                {parseFloat(discount) === 0 && (
                                    <span className="font-bold text-danger">- R$ 0,00</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[#111418] dark:text-white text-base font-bold mb-2">Observações</label>
                            <textarea value={details} onChange={e => setDetails(e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark p-4 h-24 resize-none focus:ring-primary focus:border-primary" placeholder="Detalhes adicionais..." />
                        </div>

                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#1a222d] border-t border-gray-100 dark:border-gray-800 z-20">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-500">Total Final</span>
                                <span className="text-3xl font-bold text-primary">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <button onClick={handleSubmit} disabled={submitting} className="w-full rounded-xl bg-primary h-14 text-white text-lg font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors">
                                {submitting ? 'Salvando...' : 'Finalizar Pedido'}
                            </button>
                        </div>
                    </div>
                )}

            </main>
        </>
    );
};

import { useAuth } from '../context/AuthContext';

export const OrderDetailsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { orderId } = useParams();
    const { user: currentUser } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const orders = await orderService.getAll();
                const found = orders.find(o => o.id.toString() === orderId);
                setOrder(found || null);
            } catch (error) {
                console.error("Failed to fetch order", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    const handleUpdateStatus = async (newStatus: OrderStatus) => {
        if (!order) return;
        setUpdating(true);
        try {
            await orderService.updateStatus(order.id, newStatus);
            setOrder({ ...order, status: newStatus });
            setShowStatusModal(false);
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Erro ao atualizar status.");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;
    if (!order) return <div className="flex justify-center items-center h-full">Pedido não encontrado</div>;

    return (
        <>
            <header className="flex items-center bg-surface-light dark:bg-surface-dark px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0 z-10">
                <button onClick={() => navigate(-1)} className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span className="material-symbols-outlined text-[#111418] dark:text-white">arrow_back</span></button>
                <h1 className="text-[#111418] dark:text-white text-lg font-bold leading-tight flex-1 text-center pr-10">Pedido #{order.id}</h1>
            </header>
            <main className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
                <div className="flex flex-col gap-4">
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[#111418] dark:text-white text-base font-bold">Status do Pedido</h3>
                            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-bold uppercase tracking-wide">{order.status}</span>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <div><p className="text-[#111418] dark:text-white text-base font-bold">{order.client.name}</p><p className="text-[#637288] dark:text-gray-400 text-sm">{order.client.phone}</p></div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => navigate(`/orders/${order.id}/invoice`)}
                                    className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                                    title="Ver Comprovante"
                                >
                                    <span className="material-symbols-outlined">receipt_long</span>
                                </button>
                                <button 
                                    onClick={() => setShowStatusModal(true)}
                                    className="flex items-center justify-center size-10 rounded-full bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors"
                                    title="Atualizar Status"
                                >
                                    <span className="material-symbols-outlined">sync</span>
                                </button>
                                <button 
                                    onClick={() => openWhatsApp(order.client.phone, `Olá ${order.client.name}, seu pedido #${order.id} está ${order.status}. Total: R$ ${order.value.toFixed(2)}.`)}
                                    className="flex items-center justify-center size-10 rounded-full bg-whatsapp/10 text-whatsapp hover:bg-whatsapp hover:text-white transition-colors"
                                    title="Enviar WhatsApp"
                                >
                                    <svg fill="currentColor" height="20" viewBox="0 0 16 16" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"></path></svg>
                                </button>
                                {currentUser?.role === 'admin' && (
                                    <button 
                                        onClick={async () => {
                                            if (confirm('Tem certeza que deseja excluir este pedido?')) {
                                                try {
                                                    await orderService.delete(order.id);
                                                    navigate('/orders');
                                                } catch (error: any) {
                                                    alert('Erro ao excluir: ' + error.message);
                                                }
                                            }
                                        }}
                                        className="flex items-center justify-center size-10 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                        title="Excluir Pedido"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Serviço</span><span className="font-medium text-[#111418] dark:text-white">{order.service}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Detalhes</span><span className="font-medium text-[#111418] dark:text-white text-right max-w-[60%]">{order.details}</span></div>
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-800"><span className="font-bold text-[#111418] dark:text-white">Total</span><span className="font-bold text-primary text-lg">R$ {order.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        </div>
                    </div>
                </div>
            </main>

            {showStatusModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full bg-white dark:bg-[#1a222d] rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-[#111418] dark:text-white">Atualizar Status</h3>
                            <button onClick={() => setShowStatusModal(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {[OrderStatus.Pendente, OrderStatus.Lavando, OrderStatus.Pronto, OrderStatus.Entregue].map(status => (
                                <button 
                                    key={status}
                                    onClick={() => handleUpdateStatus(status)}
                                    disabled={updating}
                                    className={`h-12 rounded-xl font-bold text-sm flex items-center justify-between px-4 ${order.status === status ? 'bg-primary text-white' : 'bg-gray-50 dark:bg-gray-800 text-[#111418] dark:text-white'}`}
                                >
                                    {status}
                                    {order.status === status && <span className="material-symbols-outlined">check</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
// Force refresh