import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import { clientService } from '../services/clientService';
import { orderService } from '../services/orderService';
import { financeService } from '../services/financeService';
import { Client, Order, TransactionType } from '../types';
import { calculateCredit, CONTRACT_TIERS, BASE_RATE, loadContractRules } from '../utils/contractUtils';
import { generateContractInvoice } from '../utils/contractInvoiceGenerator';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ClientClosing {
    client: Client;
    orders: Order[];
    totalKg: number;
    alreadyCharged: number;
    rate: number;
    shouldCharge: number;
    credit: number;
    tierLabel: string;
}

// ─── Helper: extrai kg do campo details do pedido ─────────────────────────────
const extractKgFromDetails = (details: string): number => {
    const newFmt = details.match(/Contrato\s*\|\s*([\d.,]+)\s*kg/i);
    if (newFmt) return parseFloat(newFmt[1].replace(',', '.'));
    const oldFmt = details.match(/Peso:\s*([\d.,]+)\s*kg/i);
    if (oldFmt) return parseFloat(oldFmt[1].replace(',', '.'));
    return 0;
};

// ─── Component ────────────────────────────────────────────────────────────────
export const ContractClosingScreen: React.FC = () => {
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [closingData, setClosingData] = useState<ClientClosing[]>([]);
    const [registering, setRegistering] = useState<string | null>(null);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [expandedClient, setExpandedClient] = useState<string | null>(null);

    const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                         'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

    useEffect(() => { loadData(); }, [month, year]);

    const loadData = async () => {
        setLoading(true);
        try {
            await loadContractRules();
            const allClients = await clientService.getAll();
            const contractClients = allClients.filter(c => c.isContract);

            const allOrders = await orderService.getAll();

            const monthOrders = allOrders.filter(o => {
                // Parse both ISO and PT-BR formatted dates
                let d: Date;
                if (o.timestamp && o.timestamp.includes('-')) {
                    d = new Date(o.timestamp);
                } else if (o.timestamp && o.timestamp.includes('/')) {
                    const parts = o.timestamp.split(',')[0].trim().split('/');
                    d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                } else {
                    return false;
                }
                if (isNaN(d.getTime())) return false;
                const isContractClient = contractClients.some(c => c.id === o.client.id);
                if (!isContractClient) return false;
                if (o.payment_method !== 'Contrato Mensal') return false;
                return d.getMonth() === (month - 1) && d.getFullYear() === year;
            });

            const data: ClientClosing[] = contractClients.map(client => {
                const clientOrders = monthOrders.filter(o => o.client.id === client.id);
                const totalKg = clientOrders.reduce((sum, o) => sum + extractKgFromDetails(o.details), 0);
                const alreadyCharged = parseFloat(
                    clientOrders.reduce((sum, o) => sum + (o.value || 0), 0).toFixed(2)
                );
                const { rate, shouldCharge, credit, tierLabel } = calculateCredit(totalKg, alreadyCharged);

                return { client, orders: clientOrders, totalKg, alreadyCharged, rate, shouldCharge, credit, tierLabel };
            });

            // Ordena: clientes com pedidos primeiro, depois por kg desc
            data.sort((a, b) => {
                if (a.orders.length === 0 && b.orders.length > 0) return 1;
                if (a.orders.length > 0 && b.orders.length === 0) return -1;
                return b.totalKg - a.totalKg;
            });

            setClosingData(data);
        } catch (error) {
            console.error('Erro ao carregar fechamento', error);
            alert('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterCredit = async (item: ClientClosing) => {
        if (item.credit <= 0) {
            alert('Este cliente não possui crédito para este período.');
            return;
        }
        const confirmMsg =
            `Registrar crédito de R$ ${item.credit.toFixed(2)} para ${item.client.name}?\n\n` +
            `• Já cobrado: R$ ${item.alreadyCharged.toFixed(2)}\n` +
            `• Deveria cobrar (${item.tierLabel}): R$ ${item.shouldCharge.toFixed(2)}\n` +
            `• Crédito: R$ ${item.credit.toFixed(2)}`;
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
            alert(`✅ Crédito de R$ ${item.credit.toFixed(2)} registrado!`);
            await loadData();
        } catch (error: any) {
            alert('Erro ao registrar crédito: ' + error.message);
        } finally {
            setRegistering(null);
        }
    };

    // ─── Totals ───
    const clientsWithOrders = closingData.filter(d => d.orders.length > 0);
    const clientsWithoutOrders = closingData.filter(d => d.orders.length === 0);
    const totalCredit = closingData.reduce((s, d) => s + (d.credit > 0 ? d.credit : 0), 0);
    const totalAlreadyCharged = closingData.reduce((s, d) => s + d.alreadyCharged, 0);
    const totalKgAll = closingData.reduce((s, d) => s + d.totalKg, 0);

    const fieldClass = "h-8 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2.5 text-xs focus:border-primary focus:ring-1 focus:ring-primary/20";

    return (
        <>
            <Header title="Fechamento de Contratos" onMenuClick={toggleSidebar} />

            {/* Filtros de período */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1a222d] border-b border-gray-200 dark:border-gray-700 shrink-0">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mr-1">Período:</span>
                <select value={month} onChange={e => setMonth(Number(e.target.value))} className={fieldClass}>
                    {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
                <select value={year} onChange={e => setYear(Number(e.target.value))} className={fieldClass}>
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button onClick={loadData} className="h-8 px-3 rounded bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
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

                        {/* Resumo compacto — 3 cards */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded p-2.5 text-center">
                                <p className="text-[9px] font-bold text-gray-400 uppercase">Total Kg</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{totalKgAll.toFixed(1)}</p>
                            </div>
                            <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded p-2.5 text-center">
                                <p className="text-[9px] font-bold text-gray-400 uppercase">Já Cobrado</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">R$ {totalAlreadyCharged.toFixed(2)}</p>
                            </div>
                            <div className="bg-white dark:bg-[#1a222d] border border-green-200 dark:border-green-800 rounded p-2.5 text-center">
                                <p className="text-[9px] font-bold text-gray-400 uppercase">Crédito</p>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">R$ {totalCredit.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Tabela de faixas — colapsada em 1 linha */}
                        <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded flex items-center divide-x divide-gray-100 dark:divide-gray-800 px-1">
                            <span className="text-[9px] font-bold text-gray-400 uppercase px-2 py-1.5 shrink-0">Faixas:</span>
                            {CONTRACT_TIERS.map((tier, i) => (
                                <span key={i} className="text-[10px] text-gray-600 dark:text-gray-300 px-2.5 py-1.5">
                                    <span className="font-bold text-primary">R${tier.price.toFixed(2)}</span>/kg {tier.label.replace(/Faixa \d+ /, '')}
                                </span>
                            ))}
                        </div>

                        {/* ─── Tabela de clientes ─── */}
                        {closingData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-center">
                                <span className="material-symbols-outlined text-gray-300 text-5xl mb-2">business</span>
                                <p className="text-sm font-bold text-gray-500">Nenhum cliente contrato cadastrado</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                                {/* Header da tabela */}
                                <div className="grid grid-cols-[1fr_60px_80px_80px_80px_90px] gap-0 px-3 py-1.5 bg-gray-50 dark:bg-[#1e2a38] border-b border-gray-200 dark:border-gray-700 text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                                    <span>Cliente</span>
                                    <span className="text-right">Kg</span>
                                    <span className="text-right">Cobrado</span>
                                    <span className="text-right">Devido</span>
                                    <span className="text-right">Crédito</span>
                                    <span className="text-right">Ação</span>
                                </div>

                                {/* Linhas com pedidos */}
                                {clientsWithOrders.map(item => {
                                    const hasCredit = item.credit > 0;
                                    const isProc = registering === item.client.id;
                                    const isExpanded = expandedClient === item.client.id;

                                    return (
                                        <React.Fragment key={item.client.id}>
                                            <div
                                                className={`grid grid-cols-[1fr_60px_80px_80px_80px_90px] gap-0 px-3 py-2 items-center border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${isExpanded ? 'bg-blue-50/50 dark:bg-blue-900/5' : ''}`}
                                                onClick={() => setExpandedClient(isExpanded ? null : item.client.id)}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="material-symbols-outlined text-primary text-[16px] shrink-0">business</span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.client.name}</p>
                                                        <p className="text-[9px] text-gray-400">{item.orders.length} pedido{item.orders.length !== 1 ? 's' : ''} • {item.tierLabel}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-900 dark:text-white text-right">{item.totalKg.toFixed(1)}</span>
                                                <span className="text-xs text-gray-600 dark:text-gray-300 text-right">R$ {item.alreadyCharged.toFixed(2)}</span>
                                                <span className="text-xs text-gray-600 dark:text-gray-300 text-right">R$ {item.shouldCharge.toFixed(2)}</span>
                                                <span className={`text-xs font-bold text-right ${hasCredit ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                                    {hasCredit ? `R$ ${item.credit.toFixed(2)}` : '—'}
                                                </span>
                                                <div className="flex justify-end">
                                                    {hasCredit ? (
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleRegisterCredit(item); }}
                                                            disabled={isProc}
                                                            className="h-6 px-2 rounded bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                                                        >
                                                            {isProc ? (
                                                                <span className="material-symbols-outlined animate-spin text-[12px]">progress_activity</span>
                                                            ) : (
                                                                <><span className="material-symbols-outlined text-[12px]">savings</span> Registrar</>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <span className="text-[9px] text-gray-400">—</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Detalhes expandidos — pedidos do mês */}
                                            {isExpanded && item.orders.length > 0 && (
                                                <div className="px-3 py-2 bg-gray-50 dark:bg-[#161f2b] border-b border-gray-200 dark:border-gray-700">
                                                    <div className="space-y-0.5">
                                                        {item.orders.map((o, idx) => {
                                                            const kg = extractKgFromDetails(o.details);
                                                            let dateStr = '—';
                                                            try {
                                                                const d = new Date(o.timestamp);
                                                                if (!isNaN(d.getTime())) dateStr = d.toLocaleDateString('pt-BR');
                                                            } catch {}
                                                            return (
                                                                <div key={o.id || idx} className="flex items-center justify-between text-[10px] py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-gray-500 w-16">{dateStr}</span>
                                                                        <span className="text-gray-700 dark:text-gray-300 w-14 text-right">{kg > 0 ? `${kg.toFixed(2)} kg` : '—'}</span>
                                                                        <span className="font-semibold text-gray-900 dark:text-white w-16 text-right">R$ {(o.value || 0).toFixed(2)}</span>
                                                                    </div>
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(`/orders/${o.id}`);
                                                                        }}
                                                                        className="flex items-center gap-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 P-1 rounded transition-colors"
                                                                        title="Visualizar ou Editar Pedido"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[14px]">edit_square</span>
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {/* Botão Gerar Fatura */}
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                generateContractInvoice({
                                                                    clientName: item.client.name,
                                                                    month,
                                                                    year,
                                                                    orders: item.orders,
                                                                    totalKg: item.totalKg,
                                                                    alreadyCharged: item.alreadyCharged,
                                                                    rate: item.rate,
                                                                    shouldCharge: item.shouldCharge,
                                                                    credit: item.credit,
                                                                    tierLabel: item.tierLabel,
                                                                });
                                                            }}
                                                            className="flex-1 h-7 rounded bg-primary hover:bg-primary-dark text-white text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-[13px]">receipt_long</span>
                                                            Gerar Fatura PDF
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}

                                {/* Clientes sem pedidos — seção colapsada */}
                                {clientsWithoutOrders.length > 0 && (
                                    <>
                                        <div className="px-3 py-1.5 bg-gray-50 dark:bg-[#1e2a38] border-b border-gray-100 dark:border-gray-800">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                                                Sem pedidos em {MONTH_NAMES[month - 1]} ({clientsWithoutOrders.length})
                                            </span>
                                        </div>
                                        {clientsWithoutOrders.map(item => (
                                            <div key={item.client.id} className="grid grid-cols-[1fr_60px_80px_80px_80px_90px] gap-0 px-3 py-1.5 items-center border-b border-gray-50 dark:border-gray-800/50 text-gray-400">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="material-symbols-outlined text-[14px]">business</span>
                                                    <span className="text-[11px] truncate">{item.client.name}</span>
                                                </div>
                                                <span className="text-[11px] text-right">—</span>
                                                <span className="text-[11px] text-right">—</span>
                                                <span className="text-[11px] text-right">—</span>
                                                <span className="text-[11px] text-right">—</span>
                                                <span className="text-[9px] text-right">Nenhum</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </>
    );
};
