import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import { clientService } from '../services/clientService';
import { orderService } from '../services/orderService';
import { financeService } from '../services/financeService';
import { Client, Order, TransactionType } from '../types';
import { calculateCredit, CONTRACT_TIERS, BASE_RATE } from '../utils/contractUtils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ClientClosing {
    client: Client;
    orders: Order[];
    totalKg: number;
    alreadyCharged: number; // soma dos pedidos do mês (a R$15,90/kg)
    rate: number;           // taxa correta pela faixa
    shouldCharge: number;   // totalKg × rate
    credit: number;         // alreadyCharged − shouldCharge (positivo = crédito ao cliente)
    tierLabel: string;
}

// ─── Helper: extrai kg do campo details do pedido ─────────────────────────────
const extractKgFromDetails = (details: string): number => {
    // Formato novo: "[Contrato | 30.00 kg × R$15.90]"
    const newFmt = details.match(/Contrato\s*\|\s*([\d.,]+)\s*kg/i);
    if (newFmt) return parseFloat(newFmt[1].replace(',', '.'));
    // Formato legado: "[Peso: 30.00 kg]" 
    const oldFmt = details.match(/Peso:\s*([\d.,]+)\s*kg/i);
    if (oldFmt) return parseFloat(oldFmt[1].replace(',', '.'));
    return 0;
};

// ─── Component ────────────────────────────────────────────────────────────────
export const ContractClosingScreen: React.FC = () => {
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const [loading, setLoading] = useState(true);
    const [closingData, setClosingData] = useState<ClientClosing[]>([]);
    const [registering, setRegistering] = useState<string | null>(null); // client id being processed
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                         'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

    useEffect(() => { loadData(); }, [month, year]);

    const loadData = async () => {
        setLoading(true);
        try {
            const allClients = await clientService.getAll();
            const contractClients = allClients.filter(c => c.isContract);

            const allOrders = await orderService.getAll();

            // Filtra pedidos do mês/ano selecionado que sejam de clientes contrato
            const monthOrders = allOrders.filter(o => {
                const d = new Date(o.timestamp);
                if (isNaN(d.getTime())) return false;
                const isContractClient = contractClients.some(c => c.id === o.client.id);
                if (!isContractClient) return false;
                // Pedidos marcados como Contrato Mensal
                if (o.payment_method !== 'Contrato Mensal') return false;
                return d.getMonth() === (month - 1) && d.getFullYear() === year;
            });

            const data: ClientClosing[] = contractClients.map(client => {
                const clientOrders = monthOrders.filter(o => o.client.id === client.id);

                // Kg totais do mês (extraídos dos detalhes)
                const totalKg = clientOrders.reduce((sum, o) => sum + extractKgFromDetails(o.details), 0);

                // Valor já cobrado = soma dos valores dos pedidos do mês
                const alreadyCharged = parseFloat(
                    clientOrders.reduce((sum, o) => sum + (o.value || 0), 0).toFixed(2)
                );

                const { rate, shouldCharge, credit, tierLabel } = calculateCredit(totalKg, alreadyCharged);

                return {
                    client,
                    orders: clientOrders,
                    totalKg,
                    alreadyCharged,
                    rate,
                    shouldCharge,
                    credit, // positivo = crédito para o cliente (pagou mais que o necessário)
                    tierLabel,
                };
            });

            setClosingData(data);
        } catch (error) {
            console.error('Erro ao carregar fechamento', error);
            alert('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Registra o crédito como Despesa no financeiro.
     * Despesa = dinheiro que "sai" da lavanderia (crédito ao cliente).
     */
    const handleRegisterCredit = async (item: ClientClosing) => {
        if (item.credit <= 0) {
            alert('Este cliente não possui crédito para este período.');
            return;
        }

        const confirmMsg =
            `Registrar crédito de R$ ${item.credit.toFixed(2)} para ${item.client.name}?\n\n` +
            `• Já cobrado: R$ ${item.alreadyCharged.toFixed(2)}\n` +
            `• Deveria cobrar (${item.tierLabel}): R$ ${item.shouldCharge.toFixed(2)}\n` +
            `• Crédito: R$ ${item.credit.toFixed(2)}\n\n` +
            `O crédito será lançado em Pagamentos como desconto no próximo mês.`;

        if (!confirm(confirmMsg)) return;

        setRegistering(item.client.id);
        try {
            await financeService.create({
                type: TransactionType.Despesa,
                description: `Crédito Contrato ${MONTH_NAMES[month - 1]}/${year} — ${item.client.name}`,
                clientName: item.client.name,
                date: new Date().toISOString().split('T')[0],
                amount: item.credit,
                paid: true,
                icon: 'savings',
                category: 'Crédito de Contrato',
                group: 'Deduções',
            });

            alert(`✅ Crédito de R$ ${item.credit.toFixed(2)} registrado com sucesso!\nConsulte em Pagamentos → Despesas.`);
            await loadData();
        } catch (error: any) {
            alert('Erro ao registrar crédito: ' + error.message);
        } finally {
            setRegistering(null);
        }
    };

    // ─── Render helpers ───────────────────────────────────────────────────────
    const fieldClass = "h-8 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2.5 text-xs focus:border-primary focus:ring-1 focus:ring-primary/20";

    const totalCredit = closingData.reduce((s, d) => s + (d.credit > 0 ? d.credit : 0), 0);
    const totalAlreadyCharged = closingData.reduce((s, d) => s + d.alreadyCharged, 0);
    const totalKgAll = closingData.reduce((s, d) => s + d.totalKg, 0);

    return (
        <>
            <Header title="Fechamento de Contratos" onMenuClick={toggleSidebar} />

            {/* Filtros de período */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1a222d] border-b border-gray-200 dark:border-gray-700 shrink-0">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mr-1">Período:</span>
                <select
                    value={month}
                    onChange={e => setMonth(Number(e.target.value))}
                    className={fieldClass}
                >
                    {MONTH_NAMES.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                </select>
                <select
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                    className={fieldClass}
                >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                </select>
                <button
                    onClick={loadData}
                    className="h-8 px-3 rounded bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                </button>
            </div>

            <main className="flex-1 overflow-y-auto p-3 pb-24 no-scrollbar bg-[#eef0f3] dark:bg-[#111821]">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                    </div>
                ) : (
                    <div className="space-y-3 max-w-2xl mx-auto">

                        {/* Tabela de Faixas */}
                        <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                            <div className="px-3 py-1.5 bg-gray-50 dark:bg-[#1e2a38] border-b border-gray-200 dark:border-gray-700">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Tabela de Faixas do Contrato</span>
                            </div>
                            <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800">
                                {CONTRACT_TIERS.map((tier, i) => (
                                    <div key={i} className="p-3 text-center">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">{tier.label}</p>
                                        <p className="text-sm font-bold text-primary">R$ {tier.price.toFixed(2)}/kg</p>
                                    </div>
                                ))}
                            </div>
                            <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-900/30">
                                <p className="text-[10px] text-blue-700 dark:text-blue-400">
                                    <span className="font-bold">Base cobrada no pedido:</span> R$ {BASE_RATE.toFixed(2)}/kg — a diferença para a faixa real é registrada como crédito ao final do mês.
                                </p>
                            </div>
                        </div>

                        {/* Resumo do mês */}
                        {closingData.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded p-3 text-center">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Total kg / mês</p>
                                    <p className="text-base font-bold text-gray-900 dark:text-white">{totalKgAll.toFixed(1)} kg</p>
                                </div>
                                <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded p-3 text-center">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Já cobrado</p>
                                    <p className="text-base font-bold text-gray-900 dark:text-white">R$ {totalAlreadyCharged.toFixed(2)}</p>
                                </div>
                                <div className="bg-white dark:bg-[#1a222d] border border-green-200 dark:border-green-800 rounded p-3 text-center">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Crédito Total</p>
                                    <p className="text-base font-bold text-green-600 dark:text-green-400">R$ {totalCredit.toFixed(2)}</p>
                                </div>
                            </div>
                        )}

                        {/* Cards por cliente */}
                        {closingData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-center">
                                <span className="material-symbols-outlined text-gray-300 text-5xl mb-2">business</span>
                                <p className="text-sm font-bold text-gray-500">Nenhum cliente contrato com pedidos em {MONTH_NAMES[month - 1]}/{year}</p>
                            </div>
                        ) : (
                            closingData.map(item => {
                                const hasCredit = item.credit > 0;
                                const isProc = registering === item.client.id;

                                return (
                                    <div key={item.client.id} className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                                        {/* Header do cliente */}
                                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-[#1e2a38] border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-[18px]">business</span>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.client.name}</p>
                                                    <p className="text-[10px] text-gray-500">{item.orders.length} pedido{item.orders.length !== 1 ? 's' : ''} em {MONTH_NAMES[month - 1]}/{year}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${hasCredit ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                                                {item.tierLabel}
                                            </span>
                                        </div>

                                        {/* Breakdown financeiro */}
                                        <div className="p-4 space-y-3">
                                            {/* Linha a linha */}
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">Total kg do mês</span>
                                                    <span className="font-bold text-gray-900 dark:text-white">{item.totalKg.toFixed(2)} kg</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">Já cobrado (R$ {BASE_RATE.toFixed(2)}/kg)</span>
                                                    <span className="font-semibold text-gray-900 dark:text-white">R$ {item.alreadyCharged.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500">Deveria cobrar (R$ {item.rate.toFixed(2)}/kg)</span>
                                                    <span className="font-semibold text-gray-900 dark:text-white">R$ {item.shouldCharge.toFixed(2)}</span>
                                                </div>
                                                <div className="border-t border-gray-100 dark:border-gray-800 pt-1.5 flex justify-between text-xs">
                                                    <span className={`font-bold ${hasCredit ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                                        {hasCredit ? 'Crédito para próximo mês' : 'Sem crédito (faixa base)'}
                                                    </span>
                                                    <span className={`font-bold text-sm ${hasCredit ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                                        {hasCredit ? `R$ ${item.credit.toFixed(2)}` : '—'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Lista de pedidos do mês (colapsável implícita — só detalhe visual) */}
                                            {item.orders.length > 0 && (
                                                <div className="bg-gray-50 dark:bg-[#161f2b] border border-gray-100 dark:border-gray-800 rounded overflow-hidden">
                                                    {item.orders.map((o, idx) => {
                                                        const kg = extractKgFromDetails(o.details);
                                                        const orderDate = new Date(o.timestamp).toLocaleDateString('pt-BR');
                                                        return (
                                                            <div key={o.id} className={`flex items-center justify-between px-3 py-1.5 text-[10px] ${idx > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}`}>
                                                                <span className="text-gray-500">{orderDate}</span>
                                                                <span className="text-gray-700 dark:text-gray-300">{kg > 0 ? `${kg.toFixed(2)} kg` : '—'}</span>
                                                                <span className="font-semibold text-gray-900 dark:text-white">R$ {(o.value || 0).toFixed(2)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Ação */}
                                            {hasCredit && (
                                                <button
                                                    onClick={() => handleRegisterCredit(item)}
                                                    disabled={isProc}
                                                    className="w-full h-9 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                                >
                                                    {isProc ? (
                                                        <><span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span> Registrando...</>
                                                    ) : (
                                                        <><span className="material-symbols-outlined text-[14px]">savings</span> Registrar Crédito — R$ {item.credit.toFixed(2)}</>
                                                    )}
                                                </button>
                                            )}

                                            {!hasCredit && item.totalKg > 0 && (
                                                <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded text-[10px] text-gray-500">
                                                    <span className="material-symbols-outlined text-[14px]">info</span>
                                                    Cliente na faixa base (R$ {BASE_RATE.toFixed(2)}/kg). Nenhum crédito a registrar.
                                                </div>
                                            )}

                                            {item.totalKg === 0 && (
                                                <div className="flex items-center gap-1.5 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/10 rounded text-[10px] text-yellow-700 dark:text-yellow-400">
                                                    <span className="material-symbols-outlined text-[14px]">warning</span>
                                                    Nenhum pedido por kg encontrado para este cliente no período.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </main>
        </>
    );
};
