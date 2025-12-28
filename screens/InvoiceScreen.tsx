
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { openWhatsApp } from '../utils/whatsappUtils';
import { Order } from '../types';

import { generateOrderPDF } from '../utils/pdfGenerator';

const InvoiceScreen: React.FC = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark text-red-500 font-bold">
                Pedido não encontrado.
            </div>
        );
    }
    
    const handleDownloadPDF = async () => {
        if (order) {
            await generateOrderPDF(order);
        }
    };



    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen overflow-y-auto">
            <header className="fixed top-0 left-0 right-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm p-4 flex justify-between items-center no-print z-50 border-b border-gray-200 dark:border-gray-700">
                 <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-800 dark:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
                 <div className="flex items-center gap-3">
                     <button onClick={handleDownloadPDF} className="flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors"><span className="material-symbols-outlined text-lg">picture_as_pdf</span><span>Baixar PDF</span></button>
                     <button 
                        onClick={() => openWhatsApp(order.client.phone, `*🧺 Comprovante de Pedido - Lavê*\n\nOlá ${order.client.name}!\n\nAqui está o resumo do seu pedido #${order.id}:\n\n*Serviço:* ${order.service}\n*Detalhes:* ${order.details}\n*Total:* R$ ${order.value?.toFixed(2).replace('.', ',')}\n\n📍 Retirada em: AV Aloisio Evangelista da Fonseca, Guaibim\n📞 Contato: (75) 98219-2177\n\n💙 Lavê. Cuidar bem é a nossa essência.\n\nObrigado pela preferência!`)}
                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-whatsapp text-white font-bold text-sm hover:bg-green-600 transition-colors"
                    >
                        <svg fill="currentColor" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"></path></svg><span>Enviar via WhatsApp</span>
                    </button>
                 </div>
            </header>
            <div className="printable-area max-w-3xl mx-auto bg-surface-light dark:bg-surface-dark rounded-2xl shadow-2xl p-8 sm:p-12 border border-gray-200 dark:border-gray-700 mt-20 sm:mt-12 mb-8">
                {/* Header com Branding */}
                <header className="pb-8 mb-8 border-b-2 border-primary/20">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className="flex size-16 shrink-0 items-center justify-center bg-gradient-to-br from-primary to-primary-dark rounded-2xl shadow-lg shadow-primary/30">
                                <span className="material-symbols-outlined filled text-white text-4xl">local_laundry_service</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">Lavê</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-1">Cuidar bem é a nossa essência.</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold text-primary mb-1">Comprovante</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Pedido <span className="font-bold text-gray-900 dark:text-white">#{order.id}</span></p>
                        </div>
                    </div>
                    
                    {/* Company Info */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="material-symbols-outlined text-lg text-primary">business</span>
                            <span><strong>CNPJ:</strong> 63.374.913/0009-8</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="material-symbols-outlined text-lg text-primary">location_on</span>
                            <span>AV Aloisio Evangelista da Fonseca, Guaibim, Valença - BA</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="material-symbols-outlined text-lg text-primary">call</span>
                            <span>(75) 98219-2177</span>
                        </div>
                    </div>
                </header>

                {/* Client and Order Details */}
                <section className="grid sm:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800/30 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">person</span>
                            Cliente
                        </h3>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">{order.client.name}</p>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">phone</span>
                                {order.client.phone}
                            </p>
                            {order.client.email && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">email</span>
                                    {order.client.email}
                                </p>
                            )}
                            {order.client.document && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">badge</span>
                                    <span className="font-medium">{order.client.type === 'Pessoa Jurídica' ? 'CNPJ:' : 'CPF:'}</span> {order.client.document}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">event</span>
                            Datas
                        </h3>
                        <div className="space-y-2">
                            <p className="text-gray-700 dark:text-white flex justify-between">
                                <span className="font-semibold">Emissão:</span> 
                                <span>{(() => {
                                    // Parse Data do Pedido from details if exists
                                    const match = order.details.match(/Data do Pedido: (\d{2}\/\d{2}\/\d{4})/);
                                    if (match) return match[1];

                                    if (!order.timestamp) return new Date().toLocaleDateString('pt-BR');
                                    const d = new Date(order.timestamp);
                                    return isNaN(d.getTime()) ? new Date().toLocaleDateString('pt-BR') : d.toLocaleDateString('pt-BR');
                                })()}</span>
                            </p>
                            <p className="text-gray-700 dark:text-white flex justify-between">
                                <span className="font-semibold">Previsão:</span> 
                                <span>{(() => {
                                    const match = order.details.match(/Previsão: (\d{2}\/\d{2}\/\d{4})/);
                                    return match ? match[1] : 'A combinar';
                                })()}</span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* Services Table */}
                <section className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 mb-8">
                    <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-primary/10 to-primary/5">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300">Descrição do Serviço</th>
                                <th scope="col" className="px-6 py-4 text-center font-bold text-gray-700 dark:text-gray-300">Qtd.</th>
                                <th scope="col" className="px-6 py-4 text-right font-bold text-gray-700 dark:text-gray-300">Valor Unit.</th>
                                <th scope="col" className="px-6 py-4 text-right font-bold text-gray-700 dark:text-gray-300">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700">
                                <td className="px-6 py-5">
                                    <div className="font-bold text-gray-900 dark:text-white">{order.service}</div>
                                    {order.details && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 whitespace-pre-line leading-tight">
                                            {order.details
                                                .replace(/Taxa Roupa Íntima: R\$ 20,00\.? ?/g, '')
                                                .replace(/Previsão: \d{2}\/\d{2}\/\d{4}\.? ?/g, '')
                                                .replace(/Data do Pedido: \d{2}\/\d{2}\/\d{4}\.? ?/g, '')
                                                .replace(/Extras: [^.]+\.? ?/g, '')
                                                .trim()
                                                .split(/\.\s+/)
                                                .filter(Boolean)
                                                .map(item => `- ${item}`)
                                                .join('\n')}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-5 text-center text-gray-700 dark:text-gray-300">1</td>
                                <div className="hidden">{/* Calculando valor do serviço base */}</div>
                                <td className="px-6 py-5 text-right text-gray-700 dark:text-gray-300">
                                    R$ {(() => {
                                        let baseVal = (order.value || 0) + (order.discount || 0);
                                        if (order.extras) baseVal -= order.extras.reduce((acc, e) => acc + e.price, 0);
                                        if (order.details.includes('Taxa Roupa Íntima: R$ 20,00')) baseVal -= 20;
                                        return baseVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                    })()}
                                </td>
                                <td className="px-6 py-5 text-right font-semibold text-gray-900 dark:text-white">
                                    R$ {(() => {
                                        let baseVal = (order.value || 0) + (order.discount || 0);
                                        if (order.extras) baseVal -= order.extras.reduce((acc, e) => acc + e.price, 0);
                                        if (order.details.includes('Taxa Roupa Íntima: R$ 20,00')) baseVal -= 20;
                                        return baseVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                    })()}
                                </td>
                            </tr>
                            
                            {/* Tax Row */}
                            {order.details.includes('Taxa Roupa Íntima: R$ 20,00') && (
                                <tr className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 dark:text-white">Taxa Roupa Íntima</div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">1</td>
                                    <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">R$ 20,00</td>
                                    <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">R$ 20,00</td>
                                </tr>
                            )}

                            {/* Render Extras */}
                            {order.extras?.map(extra => (
                                <tr key={extra.id} className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 dark:text-white">Extra: {extra.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">1</td>
                                    <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">R$ {extra.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">R$ {extra.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                
                {/* Payment Summary */}
                <section className="flex justify-end mb-8">
                    <div className="w-full max-w-sm bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-3">
                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                            <span>Subtotal</span>
                            <span>R$ {(() => {
                                let subtotal = order.value || 0;
                                if (order.extras && order.extras.length > 0) {
                                    subtotal += order.extras.reduce((acc, extra) => acc + extra.price, 0);
                                }
                                return subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            })()}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                            <span>Descontos</span>
                            <span>R$ {(order.discount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="border-t-2 border-gray-300 dark:border-gray-600"></div>
                        <div className="flex justify-between text-xl font-bold">
                            <span className="text-gray-900 dark:text-white">Total a Pagar</span>
                            <span className="text-primary">R$ {(() => {
                                let subtotal = order.value || 0;
                                if (order.extras && order.extras.length > 0) {
                                    subtotal += order.extras.reduce((acc, extra) => acc + extra.price, 0);
                                }
                                const total = Math.max(0, subtotal - (order.discount || 0));
                                return total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            })()}</span>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                     <div className="mb-4">
                         <p className="text-lg font-bold text-primary mb-1">Obrigado pela sua preferência!</p>
                         <p className="text-sm text-gray-600 dark:text-gray-400">Seu pedido será tratado com todo cuidado e carinho.</p>
                     </div>
                     <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                         <span className="material-symbols-outlined filled text-primary text-sm">favorite</span>
                         <span>Lavê. Cuidar bem é a nossa essência.</span>
                     </div>
                </footer>
            </div>
        </div>
    );
};

export default InvoiceScreen;
