import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { Order, OrderStatus, Client, OrderItem } from '../types';
import Header from '../components/Header';
import { ClientModal } from './ClientScreens';
import { openWhatsApp } from '../utils/whatsappUtils';
import { orderService } from '../services/orderService';
import { orderItemService } from '../services/orderItemService';
import { clientService } from '../services/clientService';
import { feeUtils } from '../utils/feeUtils';

export const OrdersListScreen: React.FC = () => {
    const navigate = useNavigate();
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [activeCategoryFilter, setActiveCategoryFilter] = useState('Todas');
    const [clientSearch, setClientSearch] = useState('');
    const [valueSearch, setValueSearch] = useState('');

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
        
        const matchesClient = order.client.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
                              order.id.toString().includes(clientSearch); // Also search by Order ID

        let matchesValue = true;
        if (valueSearch) {
            const searchVal = parseFloat(valueSearch.replace(',', '.'));
            if (!isNaN(searchVal)) {
                // Match exact value with small tolerance
                matchesValue = Math.abs(order.value - searchVal) < 0.05;
            }
        }

        return matchesStatus && matchesCategory && matchesClient && matchesValue;
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
            
            {/* Search Filters */}
            <div className="px-4 pt-3 pb-1 bg-white dark:bg-[#111821] flex gap-2">
                <div className="flex-1 relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                    <input 
                        type="text" 
                        placeholder="Nome ou Nº Pedido" 
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none text-[#111418] dark:text-white placeholder-gray-500"
                    />
                </div>
                <div className="w-28 relative">
                    <span className="text-gray-400 text-xs absolute left-2 top-1/2 -translate-y-1/2 font-bold">R$</span>
                    <input 
                        type="number" 
                        placeholder="Valor" 
                        value={valueSearch}
                        onChange={(e) => setValueSearch(e.target.value)}
                        className="w-full pl-7 pr-2 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none text-[#111418] dark:text-white placeholder-gray-500"
                        step="0.01"
                    />
                </div>
            </div>

            <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar items-center bg-white dark:bg-[#111821] shadow-sm z-10 border-t border-gray-50 dark:border-gray-800/50">
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
                                            <p className="text-[#111418] dark:text-white text-sm font-bold leading-tight flex items-center gap-2">
                                                #{order.id.toString().padStart(4, '0')} • {order.client.name}
                                                {order.isPaid && (
                                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                                                        <span className="material-symbols-outlined text-[10px]">attach_money</span> PAGO
                                                    </span>
                                                )}
                                            </p>
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

    const [showStatusModal, setShowStatusModal] = useState(false);
    const [kgCategory, setKgCategory] = useState<string>('');
    const [showIndividualItems, setShowIndividualItems] = useState(false);
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState('');
    const [underwearTax, setUnderwearTax] = useState(false);
    const [showNewClientModal, setShowNewClientModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [touristName, setTouristName] = useState('');
    const [touristContact, setTouristContact] = useState('');
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsData, servicesData, itemsData, extrasData] = await Promise.all([
                    clientService.getAll(),
                    catalogService.getServices(),
                    catalogService.getItems(),
                    catalogService.getExtras()
                ]);
                setClients(clientsData.sort((a, b) => a.name.localeCompare(b.name)));
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
                // Add items cost if any selected in mixed mode
                total += selectedItems.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);
            } else {
                total += selectedItems.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);
            }
        }
        total += selectedExtras.reduce((acc, curr) => acc + curr.price, 0);
        if (underwearTax) total += 20;

        const discountAmount = parseFloat(discount) || 0;
        return Math.max(0, total - discountAmount);
    };

    const handleDiscountChange = (delta: number) => {
        const current = parseFloat(discount) || 0;
        const next = Math.max(0, current + delta);
        setDiscount(next.toString());
    };

    const saveCurrentService = () => {
        if (!selectedService) return;

        const serviceValue = calculateTotal();
        let serviceName = selectedService.name;
        let quantity = 1;
        let unitPrice = serviceValue;

        // Build service description
        if (selectedService.type === 'kg') {
            quantity = parseFloat(weight) || 0;
            unitPrice = selectedService.price;
            serviceName += ` (${kgCategory || 'Kg'})`;
        } else {
            quantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
            unitPrice = quantity > 0 ? serviceValue / quantity : serviceValue;
        }

        const newItem: OrderItem = {
            service_name: serviceName,
            quantity: quantity,
            unit_price: unitPrice,
            subtotal: serviceValue
        };

        setOrderItems(prev => [...prev, newItem]);

        // Reset current service selection
        setSelectedService(null);
        setWeight('');
        setSelectedItems([]);
        setSelectedExtras([]);
        setKgCategory('');
        setShowIndividualItems(false);
        setUnderwearTax(false);
    };

    const calculateTotalAllServices = () => {
        const currentServiceTotal = calculateTotal();
        const savedServicesTotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
        return currentServiceTotal + savedServicesTotal - (parseFloat(discount) || 0);
    };

    const handleSubmit = async () => {
        if (!selectedClient) return;
        
        setSubmitting(true);
        try {
            // Collect all services including the current one
            let allItems = [...orderItems];
            
            // Add current service if there is one
            if (selectedService) {
                const serviceValue = calculateTotal();
                let serviceName = selectedService.name;
                let quantity = 1;
                let unitPrice = serviceValue;

                if (selectedService.type === 'kg') {
                    quantity = parseFloat(weight) || 0;
                    unitPrice = selectedService.price;
                    serviceName += ` (${kgCategory || 'Kg'})`;
                } else {
                    quantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
                    unitPrice = quantity > 0 ? serviceValue / quantity : serviceValue;
                }

                const currentItem: OrderItem = {
                    service_name: serviceName,
                    quantity: quantity,
                    unit_price: unitPrice,
                    subtotal: serviceValue
                };
                
                allItems.push(currentItem);
            }
            
            if (allItems.length === 0) {
                alert('Adicione pelo menos um serviço');
                setSubmitting(false);
                return;
            }

            const totalValue = allItems.reduce((sum, item) => sum + item.subtotal, 0) - (parseFloat(discount) || 0);

            // Format dates avoiding timezone issues
            const formatDate = (d: string) => {
                const [y, m, day] = d.split('-');
                return `${day}/${m}/${y}`;
            };

            const deliveryDescription = deliveryDate ? `Previsão: ${formatDate(deliveryDate)}` : '';
            const orderDateDescription = orderDate ? `Data do Pedido: ${formatDate(orderDate)}` : '';

            const finalDetails = [
                deliveryDescription,
                orderDateDescription,
                details
            ].filter(Boolean).join('. ');

            const isTourist = selectedClient.name.toLowerCase().includes('turista');
            const finalClientName = (isTourist && touristName) 
                ? `Turista - ${touristName}${touristContact ? ` - ${touristContact}` : ''}` 
                : selectedClient.name;

            const newOrder: Order = {
                id: 0,
                client: { ...selectedClient, name: finalClientName },
                service: `${allItems.length} serviço(s)`,
                details: finalDetails,
                value: totalValue,
                status: OrderStatus.Pendente,
                extras: [],
                discount: parseFloat(discount) || 0,
                timestamp: new Date().toISOString()
            };

            const createdOrder = await orderService.create(newOrder);
            
            // Create order items
            const itemsToCreate = allItems.map(item => ({
                ...item,
                order_id: createdOrder.id
            }));
            
            await orderItemService.createMany(itemsToCreate);

            // Print functionality disabled by user request
            // window.open(...) removed

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
                <button onClick={() => {
                    if (step === 11) setStep(1);
                    else if (step > 1) setStep(step - 1);
                    else navigate(-1);
                }} className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#111418] dark:text-white"><span className="material-symbols-outlined text-2xl">arrow_back</span></button>
                <div className="flex-1 flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(s => (
                        <div key={s} className={`h-2 w-8 rounded-full transition-colors ${step >= s ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    ))}
                </div>
                <div className="size-10"></div>
            </header>

            <main className="flex-1 overflow-y-auto pb-40 no-scrollbar bg-background-light dark:bg-background-dark p-4">
                {step === 1 && (
                    <div className="space-y-4 animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-[#111418] dark:text-white">Quem é o cliente?</h2>
                            <button onClick={() => setShowNewClientModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-bold hover:bg-primary hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-lg">add</span>
                                <span className="text-sm">Novo Cliente</span>
                            </button>
                        </div>

                        <input 
                            type="text" 
                            placeholder="Buscar cliente..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark px-4 py-3 mb-4 focus:ring-primary focus:border-primary" 
                        />
                        
                        <div className="space-y-3">
                            {clients
                                .filter(client => 
                                    client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                    (client.phone && client.phone.includes(searchTerm))
                                )
                                .map(client => (
                                <div key={client.id} onClick={() => { 
                                    setSelectedClient(client); 
                                    if (client.name.toLowerCase().includes('turista')) {
                                        setStep(11); // Step 1.1 for Tourist
                                    } else {
                                        setStep(2); 
                                    }
                                }} className="flex items-center gap-3 p-3 bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:scale-[0.99]">
                                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12" style={{ backgroundImage: `url("${client.avatarUrl}")` }}></div>
                                    <div><p className="font-bold text-[#111418] dark:text-white text-lg">{client.name}</p><p className="text-sm text-gray-500">{client.phone}</p></div>
                                    <span className="material-symbols-outlined ml-auto text-gray-400">chevron_right</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {step === 11 && (
                    <div className="space-y-4 animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-[#111418] dark:text-white">Identificação do Turista</h2>
                        </div>
                        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-gray-100 dark:border-gray-800 text-center space-y-4">
                            <p className="text-gray-500">Para facilitar a identificação, informe o nome ou local do turista.</p>
                            <input 
                                type="text" 
                                value={touristName}
                                onChange={e => setTouristName(e.target.value)}
                                placeholder="Ex: João - Quarto 102"
                                className="w-full text-center text-xl font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-4 focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                                autoFocus
                            />
                            <input 
                                type="text" 
                                value={touristContact}
                                onChange={e => setTouristContact(e.target.value)}
                                placeholder="Contato / WhatsApp (Opcional)"
                                className="w-full text-center text-xl font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-4 focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                            />
                        </div>
                        <button 
                            disabled={!touristName.trim()}
                            onClick={() => setStep(2)} 
                            className="w-full rounded-xl bg-primary h-14 text-white text-lg font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors mt-8"
                        >
                            Continuar
                        </button>
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
                            
                            {/* Option to add individual items (Mixed Mode) */}
                            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                                <button 
                                    onClick={() => setShowIndividualItems(!showIndividualItems)}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <span className="font-bold flex items-center gap-2"><span className="material-symbols-outlined">add_circle</span> Adicionar Peças Avulsas</span>
                                    <span className={`material-symbols-outlined transform transition-transform ${showIndividualItems ? 'rotate-180' : ''}`}>expand_more</span>
                                </button>
                                
                                {showIndividualItems && (
                                    <div className="mt-4 animate-in slide-in-from-top duration-300">
                                        <h3 className="text-[#111418] dark:text-white text-lg font-bold mb-3 text-left">Selecionar Peças</h3>
                                        <div className="grid gap-2 text-left">
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
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-4">Detalhes do Pedido</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[#111418] dark:text-white text-base font-bold mb-2">Data do Pedido</label>
                                <input 
                                    type="date" 
                                    value={orderDate} 
                                    onChange={e => setOrderDate(e.target.value)} 
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark px-4 py-3 focus:ring-primary focus:border-primary text-gray-900 dark:text-white" 
                                />
                            </div>

                            <div>
                                <label className="block text-[#111418] dark:text-white text-base font-bold mb-2">Previsão de Entrega</label>
                                <input 
                                    type="date" 
                                    value={deliveryDate} 
                                    onChange={e => setDeliveryDate(e.target.value)} 
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark px-4 py-3 focus:ring-primary focus:border-primary text-gray-900 dark:text-white" 
                                />
                            </div>

                            <div>
                                <label className="block text-[#111418] dark:text-white text-base font-bold mb-2">Observações</label>
                                <textarea value={details} onChange={e => setDetails(e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark p-4 h-32 resize-none focus:ring-primary focus:border-primary" placeholder="Instruções de lavagem, manchas específicas, etc..." />
                            </div>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-32">
                        <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-4">Custos Adicionais</h2>
                        {/* Taxa de Roupa Íntima */}
                        <div onClick={() => setUnderwearTax(!underwearTax)} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${underwearTax ? 'bg-primary/5 border-primary/30' : 'bg-surface-light dark:bg-surface-dark border-gray-100 dark:border-gray-800'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`size-6 rounded-md border flex items-center justify-center ${underwearTax ? 'bg-primary border-primary text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                    {underwearTax && <span className="material-symbols-outlined text-sm">check</span>}
                                </div>
                                <div>
                                    <span className="block font-bold text-[#111418] dark:text-white">Taxa Roupa Íntima</span>
                                    <span className="text-xs text-gray-500">Adicional para peças íntimas</span>
                                </div>
                            </div>
                            <span className="font-bold text-primary">+ R$ 20,00</span>
                        </div>

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

                        {/* Desconto Manual */}
                        <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-surface-light dark:bg-surface-dark">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-[#111418] dark:text-white">Desconto</span>
                                <span className="font-bold text-danger">- R$ {parseFloat(discount || '0').toFixed(2)}</span>
                            </div>
                            <div className="mt-2">
                                <label className="text-xs text-gray-500 mb-1 block">Valor do desconto (R$)</label>
                                <input 
                                    type="number" 
                                    value={discount} 
                                    onChange={e => setDiscount(e.target.value)} 
                                    className="w-full text-center text-xl font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footers */}
            {step === 3 && selectedService && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#1a222d] border-t border-gray-100 dark:border-gray-800 z-20">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-500">Total Estimado</span>
                        <span className="text-3xl font-bold text-primary">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <button onClick={() => setStep(4)} disabled={calculateTotal() === 0 || (selectedService.type === 'kg' && !kgCategory)} className="w-full rounded-xl bg-primary h-14 text-white text-lg font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors">
                        Continuar
                    </button>
                </div>
            )}

            {step === 4 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#1a222d] border-t border-gray-100 dark:border-gray-800 z-20">
                    <button onClick={() => setStep(5)} className="w-full rounded-xl bg-primary h-14 text-white text-lg font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors">
                        Continuar
                    </button>
                </div>
            )}

            {step === 5 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#1a222d] border-t border-gray-100 dark:border-gray-800 z-20">
                    {/* Show saved services */}
                    {orderItems.length > 0 && (
                        <div className="mb-4 max-h-32 overflow-y-auto space-y-2">
                            <p className="text-xs text-gray-500 mb-2">Serviços adicionados:</p>
                            {orderItems.map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                    <span className="text-gray-900 dark:text-white">{item.service_name} ({item.quantity})</span>
                                    <span className="font-bold text-primary">R$ {item.subtotal.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-500">Total Final</span>
                        <span className="text-3xl font-bold text-primary">R$ {calculateTotalAllServices().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    
                    <div className="space-y-2">
                        {selectedService && (
                            <button 
                                onClick={() => {
                                    saveCurrentService();
                                    setStep(2);
                                }} 
                                className="w-full rounded-xl bg-gray-200 dark:bg-gray-700 h-12 text-gray-900 dark:text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                <span className="material-symbols-outlined">add</span>
                                Adicionar Outro Serviço
                            </button>
                        )}
                        <button 
                            onClick={handleSubmit} 
                            disabled={submitting || (orderItems.length === 0 && !selectedService)} 
                            className="w-full rounded-xl bg-primary h-14 text-white text-lg font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors"
                        >
                            {submitting ? 'Salvando...' : 'Finalizar Pedido'}
                        </button>
                    </div>
                </div>
            )}
            {showNewClientModal && (
                <ClientModal 
                    onClose={() => setShowNewClientModal(false)}
                    onSuccess={() => {
                        setShowNewClientModal(false);
                        const fetchData = async () => {
                            const clientsData = await clientService.getAll();
                            setClients(clientsData.sort((a, b) => a.name.localeCompare(b.name)));
                        };
                        fetchData();
                    }}
                />
            )}
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
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [updating, setUpdating] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editValue, setEditValue] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [isDelivering, setIsDelivering] = useState(false);

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
        
        // Decoupled logic: Just update status, do not prompt for payment.
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

    const handlePaymentSubmit = async (method: string) => {
        if (!order) return;
        setUpdating(true);
        try {
            // Update only payment method. Logic: If payment method is present, it's paid.
            await orderService.updateStatus(order.id, order.status, method); 
            
            setOrder({ ...order, isPaid: true, payment_method: method });
            setShowPaymentModal(false);
        } catch (error) {
            console.error("Failed to update payment", error);
            alert("Erro ao confirmar pagamento.");
        } finally {
            setUpdating(false);
        }
    };

    const handleConfirmPayment = async (methodOverride?: string) => {
        const methodToUse = typeof methodOverride === 'string' ? methodOverride : selectedPaymentMethod;
        
        if (!order || !methodToUse) return;
        setUpdating(true);
        try {
            // Calculate fees to persist
            const currentFees = feeUtils.getFees();
            
            // Debug logs
            console.log('=== PAYMENT CONFIRMATION DEBUG ===');
            console.log('Payment Method:', methodToUse);
            console.log('Order Value:', order.value);
            console.log('All Fees Config:', currentFees);
            console.log('Fee for this method:', currentFees[methodToUse]);
            
            const netValue = feeUtils.calculateNetValue(order.value, methodToUse, currentFees);
            const fee = order.value - netValue;
            
            // Calculate fee percentage for this payment method
            let feePercentage = 0;
            const feeConfig = currentFees[methodToUse as keyof typeof currentFees];
            if (typeof feeConfig === 'number') {
                feePercentage = feeConfig;
            }
            
            console.log('Fee Percentage:', feePercentage + '%');
            console.log('Calculated Fee (R$):', fee);
            console.log('Net Value (R$):', netValue);
            console.log('===================================');

            // Just Paying (Mark as Paid) logic - save fee, netValue, and feePercentage
            await orderService.updateStatus(order.id, order.status, methodToUse, fee, netValue, feePercentage);
            setOrder({ 
                ...order, 
                payment_method: methodToUse, 
                isPaid: true,
                fee: fee,
                netValue: netValue,
                feePercentage: feePercentage,
                payment_date: new Date().toISOString()
            });
            
            setShowPaymentModal(false);
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Erro ao salvar.");
        } finally {
            setUpdating(false);
        }
    };

    const handleOpenEdit = () => {
        if (!order) return;
        setEditValue(order.value.toString());
        setEditDescription(order.details);
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!order) return;
        setUpdating(true);
        try {
            const updatedOrder = {
                ...order,
                value: parseFloat(editValue.replace(',', '.')) || 0,
                details: editDescription
            };
            await orderService.update(updatedOrder);
            setOrder(updatedOrder);
            setShowEditModal(false);
        } catch (error) {
            console.error("Failed to update order", error);
            alert("Erro ao editar pedido.");
        } finally {
            setUpdating(false);
        }
    };

    const handleRevertPayment = async () => {
        if (!order || !order.isPaid) return;
        
        const confirmRevert = confirm(
            'Tem certeza que deseja reverter o pagamento?\n\n' +
            'Isso vai:\n' +
            '- Remover o método de pagamento\n' +
            '- Limpar a taxa e valor líquido\n' +
            '- Marcar o pedido como NÃO PAGO'
        );

        if (!confirmRevert) return;

        setUpdating(true);
        try {
            await orderService.clearPayment(order.id);
            setOrder({ 
                ...order, 
                payment_method: undefined,
                isPaid: false,
                fee: 0,
                netValue: 0
            });
            alert('Pagamento revertido com sucesso!');
        } catch (error) {
            console.error("Failed to revert payment", error);
            alert("Erro ao reverter pagamento.");
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
                <div className="flex-1 text-center">
                    <h1 className="text-[#111418] dark:text-white text-lg font-bold leading-tight">Pedido #{order.id}</h1>
                </div>
                {currentUser?.role === 'admin' ? (
                    <button onClick={handleOpenEdit} className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-primary" title="Editar Pedido">
                        <span className="material-symbols-outlined text-2xl">edit</span>
                    </button>
                ) : (
                    <div className="size-10"></div>
                )}
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
                                    onClick={() => setShowPaymentModal(true)}
                                    className={`flex items-center justify-center size-10 rounded-full transition-colors ${order.isPaid ? 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-primary hover:text-white'}`}
                                    title={order.isPaid ? "Pagamento Confirmado" : "Confirmar Pagamento"}
                                >
                                    <span className="material-symbols-outlined">attach_money</span>
                                </button>
                                {order.isPaid && (
                                    <button 
                                        onClick={handleRevertPayment}
                                        className="flex items-center justify-center size-10 rounded-full bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors"
                                        title="Reverter Pagamento"
                                    >
                                        <span className="material-symbols-outlined">undo</span>
                                    </button>
                                )}
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

                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <span className="text-gray-500 text-sm">Serviço</span>
                                    <p className="font-medium text-[#111418] dark:text-white">{order.service}</p>
                                    
                                    {/* Itemized Services List */}
                                    {order.orderItems && order.orderItems.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {order.orderItems.map((item, index) => (
                                                <div key={index} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                                    <span className="text-gray-700 dark:text-gray-300">
                                                        {item.service_name} <span className="text-xs text-gray-500">({item.quantity}x)</span>
                                                    </span>
                                                    <span className="font-bold text-primary">R$ {item.subtotal.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right ml-4">
                                    <span className="text-gray-500 text-sm">Pagamento</span>
                                    <div className="flex flex-col items-end gap-1">
                                        {order.isPaid ? (
                                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold text-sm bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-lg">
                                                <span className="material-symbols-outlined text-sm">check_circle</span> Pago
                                            </span>
                                        ) : (
                                            <span className="text-sm font-bold text-orange-500">Pendente</span>
                                        )}
                                        {order.payment_method && <span className="text-xs text-gray-500">{order.payment_method}</span>}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Detalhes</span><span className="font-medium text-[#111418] dark:text-white text-right max-w-[60%] flex flex-col items-end">
                                {order.details.split('. ').map((part, index, arr) => (
                                    <span key={index}>{part}{index < arr.length - 1 ? '.' : ''}</span>
                                ))}
                            </span></div>
                            {order.discount && order.discount > 0 && (
                                <div className="flex justify-between text-sm text-red-500"><span className="font-medium">Desconto</span><span className="font-bold">- R$ {order.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                            )}
                            {order.payment_method && (() => {
                                // Use persisted values if they exist, otherwise calculate (fallback)
                                const fees = feeUtils.getFees();
                                const calculatedNet = feeUtils.calculateNetValue(order.value, order.payment_method, fees);
                                const calculatedFee = order.value - calculatedNet;

                                const displayFee = order.fee !== undefined ? order.fee : calculatedFee;
                                const displayNet = order.netValue !== undefined ? order.netValue : calculatedNet;

                                if (displayFee <= 0) return null;

                                return (
                                    <>
                                        <div className="flex justify-between text-sm text-red-500">
                                            <span className="font-medium">Taxa ({order.payment_method})</span>
                                            <span className="font-bold">- R$ {displayFee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-800">
                                            <span className="font-bold text-gray-500">Subtotal</span>
                                            <span className="font-bold text-gray-500 line-through text-sm">R$ {order.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold text-[#111418] dark:text-white">Total a Receber</span>
                                            <span className="font-bold text-primary text-lg">R$ {displayNet.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </>
                                );
                            })() || (
                                <div className="flex justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <span className="font-bold text-[#111418] dark:text-white">Total</span>
                                    <span className="font-bold text-primary text-lg">R$ {order.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
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

            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1a222d] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-[#111418] dark:text-white">Editar Pedido</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-6 space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Total (R$)</label>
                                <input 
                                    type="text" 
                                    value={editValue} 
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark px-4 py-3 focus:ring-primary focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição / Detalhes</label>
                                <textarea 
                                    value={editDescription} 
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={5}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark px-4 py-3 focus:ring-primary focus:border-primary resize-none outline-none transition-all"
                                />
                            </div>
                            <button 
                                onClick={handleSaveEdit} 
                                disabled={updating}
                                className="w-full rounded-xl bg-primary h-14 text-white text-lg font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-50"
                            >
                                {updating ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full bg-white dark:bg-[#1a222d] rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-[#111418] dark:text-white">Confirmar Pagamento</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="flex flex-col gap-2 mb-4">
                            {['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'].map(method => (
                                <button 
                                    key={method}
                                    onClick={() => setSelectedPaymentMethod(method)}
                                    className={`h-12 rounded-xl font-bold text-sm flex items-center justify-between px-4 ${selectedPaymentMethod === method ? 'bg-primary text-white' : 'bg-gray-50 dark:bg-gray-800 text-[#111418] dark:text-white'}`}
                                >
                                    {method}
                                    {selectedPaymentMethod === method && <span className="material-symbols-outlined">check</span>}
                                </button>
                            ))}
                            
                            {/* Installment Selector for Credit Card */}
                            {selectedPaymentMethod === 'Cartão de Crédito' && (
                                <div className="mt-2 animate-in slide-in-from-top duration-200">
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">Parcelas</label>
                                    <select 
                                        id="installment-select"
                                        className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark px-4 font-bold text-[#111418] dark:text-white"
                                        defaultValue="1"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                                            <option key={num} value={num}>{num}x</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => {
                                let finalMethod = selectedPaymentMethod;
                                if (selectedPaymentMethod === 'Cartão de Crédito') {
                                    const select = document.getElementById('installment-select') as HTMLSelectElement;
                                    const installments = select.value;
                                    finalMethod = `Cartão de Crédito (${installments}x)`;
                                }

                                handleConfirmPayment(finalMethod); 
                            }}
                            disabled={!selectedPaymentMethod || updating}
                            className="w-full h-12 rounded-xl bg-primary text-white font-bold disabled:opacity-50 hover:bg-primary-dark transition-colors"
                        >
                            Confirmar Pagamento
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};