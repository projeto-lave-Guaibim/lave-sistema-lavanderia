import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { Order } from '../types';

export const TicketScreen: React.FC = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState<Order | null>(null);
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

    useEffect(() => {
        if (order && !loading) {
            // Pequeno delay para garantir que o render terminou antes de imprimir
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [order, loading]);

    if (loading) return <div>Carregando...</div>;
    if (!order) return <div>Pedido não encontrado</div>;

    // Helper para formatar data
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('pt-BR');
        } catch {
            return dateStr;
        }
    };

    // Extrair datas dos detalhes se necessário
    const orderDate = order.details.match(/Data do Pedido: (\d{2}\/\d{2}\/\d{4})/) ? 
        order.details.match(/Data do Pedido: (\d{2}\/\d{2}\/\d{4})/)![1] : 
        formatDate(order.timestamp || new Date().toISOString());
        
    const deliveryDate = order.details.match(/Previsão: (\d{2}\/\d{2}\/\d{4})/) ? 
        order.details.match(/Previsão: (\d{2}\/\d{2}\/\d{4})/)![1] : 
        'A combinar';

    return (
        <div className="bg-white text-black p-2 min-h-screen">
            {/* Estilos específicos para impressão térmica */}
            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                }
                body {
                    background-color: white;
                    color: black;
                    font-family: 'Courier New', Courier, monospace; 
                }
                .ticket-container {
                    width: 58mm; /* Configuração base para impressoras de 58mm */
                    max-width: 100%;
                    margin: 0 auto;
                    padding: 5px;
                }
                .divider {
                    border-bottom: 1px dashed black;
                    margin: 8px 0;
                    width: 100%;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .text-lg { font-size: 16px; }
                .text-md { font-size: 14px; }
                .text-sm { font-size: 12px; }
                .text-xs { font-size: 10px; }
                .flex-between { display: flex; justify-content: space-between; }
                .uppercase { text-transform: uppercase; }
            `}</style>
            
            <div className="ticket-container">
                {/* Cabeçalho */}
                <div className="text-center">
                    <h1 className="text-lg font-bold uppercase mb-1">LAVÊ</h1>
                    <p className="text-xs">Lavanderia & Serviços</p>
                    <p className="text-xs mt-1">Av. Aloisio Evangelista da Fonseca</p>
                    <p className="text-xs">Guaibim, Valença - BA</p>
                    <p className="text-xs font-bold mt-1">Tel: (75) 98219-2177</p>
                    <p className="text-xs">CNPJ: 63.374.913/0001-98</p>
                </div>

                <div className="divider"></div>

                {/* Info do Pedido */}
                <div className="text-center mb-2">
                    <p className="text-lg font-bold">PEDIDO #{order.id}</p>
                    <p className="text-xs">{orderDate}</p>
                </div>

                <div className="text-sm mb-2">
                    <p className="font-bold">CLIENTE:</p>
                    <p className="uppercase">{order.client.name.substring(0, 25)}</p>
                    <p className="text-xs">{order.client.phone}</p>
                </div>

                <div className="divider"></div>

                {/* Itens */}
                <div className="mb-2">
                    <p className="font-bold text-xs mb-1">ITENS / SERVIÇOS</p>
                    {order.orderItems && order.orderItems.length > 0 ? (
                        order.orderItems.map((item, idx) => (
                            <div key={idx} className="mb-1 text-sm">
                                <p className="font-bold">{item.service_name}</p>
                                <div className="flex-between">
                                    <span>{item.quantity} x R$ {item.unit_price.toFixed(2)}</span>
                                    <span>R$ {item.subtotal.toFixed(2)}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="mb-1 text-sm">
                            <p className="font-bold">{order.service}</p>
                            <div className="flex-between">
                                <span>1 x R$ {order.value.toFixed(2)}</span>
                                <span>R$ {order.value.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Taxa Roupa Íntima */}
                    {order.details.includes('Taxa Roupa Íntima: R$ 20,00') && (
                         <div className="flex-between text-sm mt-1">
                            <span>Taxa R. Íntima</span>
                            <span>R$ 20,00</span>
                        </div>
                    )}

                    {/* Extras */}
                    {order.extras && order.extras.map((extra, idx) => (
                        <div key={`extra-${idx}`} className="flex-between text-sm mt-1">
                            <span>{extra.name}</span>
                            <span>R$ {extra.price.toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="divider"></div>

                {/* Totais */}
                <div className="text-right">
                    <div className="flex-between text-sm">
                        <span>Subtotal:</span>
                        <span>R$ {((order.value + (order.discount || 0))).toFixed(2)}</span>
                    </div>
                    {(order.discount || 0) > 0 && (
                        <div className="flex-between text-sm">
                            <span>Desconto:</span>
                            <span>-R$ {order.discount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex-between text-lg font-bold mt-1">
                        <span>TOTAL:</span>
                        <span>R$ {order.value.toFixed(2)}</span>
                    </div>
                </div>

                <div className="divider"></div>

                {/* Rodapé */}
                <div className="text-center text-xs mt-2">
                    <p className="font-bold mb-1">PREVISÃO: {deliveryDate}</p>
                    <p className="mb-2">Não nos responsabilizamos por roupas não retiradas em até 90 dias.</p>
                    <p className="font-bold">Obrigado pela preferência!</p>
                    <p className="mt-2 text-[10px]">www.lavelavanderia.com.br</p>
                </div>
            </div>
            
            <div className="fixed bottom-4 right-4 flex gap-3 no-print">
                <button 
                    onClick={() => window.close()}
                    className="bg-gray-500 text-white rounded-full size-12 shadow-lg flex items-center justify-center hover:bg-gray-600 transition-colors"
                    title="Fechar"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
                <button 
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white rounded-full size-12 shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                    title="Imprimir"
                >
                    <span className="material-symbols-outlined">print</span>
                </button>
            </div>
        </div>
    );
};
