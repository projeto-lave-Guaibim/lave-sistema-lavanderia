
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
    
    const handleDownloadPDF = () => {
        if (order) {
            generateOrderPDF(order);
        }
    };

    const today = new Date();

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen py-6 sm:py-12">
            <header className="fixed top-0 left-0 right-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm p-4 flex justify-between items-center no-print z-50">
                 <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-800 dark:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
                 <div className="flex items-center gap-3">
                     <button onClick={handleDownloadPDF} className="flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors"><span className="material-symbols-outlined text-lg">picture_as_pdf</span><span>Baixar PDF</span></button>
                     <button 
                        onClick={() => openWhatsApp(order.client.phone, `*Comprovante de Pedido - Lavê*\n\nOlá ${order.client.name}, aqui está o resumo do seu pedido #${order.id}.\n\n*Serviço:* ${order.service}\n*Detalhes:* ${order.details}\n*Total:* R$ ${order.value?.toFixed(2).replace('.', ',')}\n\nObrigado pela preferência!`)}
                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-whatsapp text-white font-bold text-sm hover:bg-green-600 transition-colors"
                    >
                        <svg fill="currentColor" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"></path></svg><span>Enviar via WhatsApp</span>
                    </button>
                 </div>
            </header>
            <div className="printable-area max-w-3xl mx-auto bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl p-6 sm:p-10 border border-gray-100 dark:border-gray-800 mt-16 sm:mt-10">
                <header className="flex justify-between items-start pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center bg-primary/10 rounded-full"><span className="material-symbols-outlined text-primary text-3xl">local_laundry_service</span></div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lavê - Lavanderia Guaibim</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">CNPJ: 12.345.678/0001-99</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Rua das Flores, 123 - Guaibim, Valença - BA</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-semibold text-primary">Comprovante</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Pedido #{order.id}</p>
                    </div>
                </header>

                <section className="grid sm:grid-cols-2 gap-6 py-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Cobrança para</h3>
                        <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{order.client.name}</p>
                        <p className="text-gray-600 dark:text-gray-300">{order.client.phone}</p>
                    </div>
                    <div className="text-left sm:text-right">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Detalhes do Pedido</h3>
                        <p className="text-gray-700 dark:text-gray-200"><span className="font-semibold">Data de Emissão:</span> {today.toLocaleDateString('pt-BR')}</p>
                        <p className="text-gray-700 dark:text-gray-200"><span className="font-semibold">Previsão de Entrega:</span> {new Date(today.setDate(today.getDate() + 2)).toLocaleDateString('pt-BR')}</p>
                    </div>
                </section>

                <section className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 rounded-l-lg">Descrição do Serviço</th>
                                <th scope="col" className="px-6 py-3 text-center">Qtd.</th>
                                <th scope="col" className="px-6 py-3 text-right">Valor</th>
                                <th scope="col" className="px-6 py-3 text-right rounded-r-lg">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-white dark:bg-surface-dark border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">{order.service}</td>
                                <td className="px-6 py-4 text-center">1</td>
                                <td className="px-6 py-4 text-right">R$ {order.value?.toFixed(2).replace('.', ',')}</td>
                                <td className="px-6 py-4 text-right font-semibold text-gray-800 dark:text-gray-200">R$ {order.value?.toFixed(2).replace('.', ',')}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
                
                <section className="flex justify-end pt-6">
                    <div className="w-full max-w-xs space-y-3">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                            <span>Subtotal</span>
                            <span>R$ {order.value?.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                            <span>Descontos</span>
                            <span>R$ 0,00</span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700"></div>
                        <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                            <span>Total a Pagar</span>
                            <span className="text-primary">R$ {order.value?.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>
                </section>

                <footer className="pt-8 mt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400 text-sm">
                     <p className="font-semibold mb-2">Obrigado pela sua preferência!</p>
                     <p>Lavê Lavanderia - Cuidando do que é seu.</p>
                </footer>
            </div>
        </div>
    );
};

export default InvoiceScreen;
