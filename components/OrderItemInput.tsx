import React, { useState, useEffect } from 'react';
import { Service, OrderItem } from '../types';
import { catalogService } from '../services/catalogService';

interface OrderItemInputProps {
    items: OrderItem[];
    onChange: (items: OrderItem[]) => void;
}

export const OrderItemInput: React.FC<OrderItemInputProps> = ({ items, onChange }) => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            const data = await catalogService.getServices();
            setServices(data);
        } catch (error) {
            console.error('Failed to load services', error);
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        const newItem: OrderItem = {
            service_name: '',
            quantity: 0,
            unit_price: 0,
            subtotal: 0
        };
        onChange([...items, newItem]);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems);
    };

    const updateItem = (index: number, field: keyof OrderItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        
        // Recalculate subtotal when quantity or unit_price changes
        if (field === 'quantity' || field === 'unit_price') {
            const qty = field === 'quantity' ? parseFloat(value) || 0 : newItems[index].quantity;
            const price = field === 'unit_price' ? parseFloat(value) || 0 : newItems[index].unit_price;
            newItems[index].subtotal = Math.round(qty * price * 100) / 100;
        }
        
        onChange(newItems);
    };

    const handleServiceSelect = (index: number, serviceId: string) => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
            updateItem(index, 'service_name', service.name);
            updateItem(index, 'service_id', parseInt(serviceId));
            updateItem(index, 'unit_price', service.price);
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.subtotal, 0);
    };

    if (loading) {
        return <div className="text-center py-4">Carregando serviços...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Serviços</h3>
                <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                    <span className="material-symbols-outlined">add</span>
                    <span>Adicionar Serviço</span>
                </button>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-2 block">shopping_cart</span>
                    <p>Nenhum serviço adicionado</p>
                    <p className="text-sm">Clique em "Adicionar Serviço" para começar</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Serviço #{index + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Service Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Serviço
                                    </label>
                                    <select
                                        value={item.service_id || ''}
                                        onChange={(e) => handleServiceSelect(index, e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                    >
                                        <option value="">Selecione...</option>
                                        {services.map(service => (
                                            <option key={service.id} value={service.id}>
                                                {service.name} - R$ {service.price.toFixed(2)}/{service.type}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Quantidade
                                    </label>
                                    <input
                                        type="number"
                                        value={item.quantity || ''}
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                        placeholder="0"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>

                                {/* Unit Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Preço Unitário
                                    </label>
                                    <input
                                        type="number"
                                        value={item.unit_price || ''}
                                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Subtotal */}
                            <div className="flex justify-end">
                                <div className="text-right">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Subtotal: </span>
                                    <span className="text-lg font-bold text-primary">
                                        R$ {item.subtotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Total */}
            {items.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                        <span className="text-2xl font-bold text-primary">
                            R$ {calculateTotal().toFixed(2)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
