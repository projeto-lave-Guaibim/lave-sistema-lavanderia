import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import { orderService } from '../services/orderService';
import { financeService } from '../services/financeService';
import { clientService } from '../services/clientService';
import { Order, Transaction, TransactionType, Client } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const extractKgFromOrder = (order: Order): number => {
    // Primary: sum all quantities from orderItems (most accurate source)
    if (order.orderItems && order.orderItems.length > 0) {
        return order.orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    }
    // Fallback: parse from details text (for older orders without orderItems)
    const details = order.details || '';
    const m1 = details.match(/Contrato\s*\|\s*([\d.,]+)\s*kg/i);
    if (m1) return parseFloat(m1[1].replace(',', '.'));
    const m2 = details.match(/Peso:\s*([\d.,]+)\s*kg/i);
    if (m2) return parseFloat(m2[1].replace(',', '.'));
    const m3 = details.match(/([\d.,]+)\s*kg/i);
    if (m3) return parseFloat(m3[1].replace(',', '.'));
    return 0;
};

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                     'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// ─── Stored Manual Inputs ─────────────────────────────────────────────────────
interface ManualInputs {
    waterCost: number;
    energyCost: number;
    productCost: number;
    maintenanceCost: number;
    hoursWorked: number;
    numWorkers: number;
    onTimeOrders: number;
    returningClients: number;
}

const getStoredInputs = (key: string): ManualInputs => {
    try {
        const stored = localStorage.getItem(`metrics_${key}`);
        if (stored) return JSON.parse(stored);
    } catch {}
    return {
        waterCost: 0,
        energyCost: 0,
        productCost: 0,
        maintenanceCost: 0,
        hoursWorked: 0,
        numWorkers: 1,
        onTimeOrders: 0,
        returningClients: 0,
    };
};

const saveStoredInputs = (key: string, inputs: ManualInputs) => {
    localStorage.setItem(`metrics_${key}`, JSON.stringify(inputs));
};

// ─── Metric Card Component ────────────────────────────────────────────────────
interface MetricCardProps {
    number: string;
    title: string;
    icon: string;
    value: string;
    subtitle?: string;
    formula?: string;
    benchmark?: string;
    frequency?: string;
    color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal';
    trend?: 'up' | 'down' | 'neutral';
    trendGood?: boolean;
}

const colorMap = {
    blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-600 dark:text-blue-400',     border: 'border-blue-200 dark:border-blue-800',     bar: 'bg-blue-500',   headerBg: 'bg-blue-600' },
    green:  { bg: 'bg-green-50 dark:bg-green-900/20',    text: 'text-green-600 dark:text-green-400',   border: 'border-green-200 dark:border-green-800',   bar: 'bg-green-500',  headerBg: 'bg-green-600' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20',  text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', bar: 'bg-orange-500', headerBg: 'bg-orange-600' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20',  text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', bar: 'bg-purple-500', headerBg: 'bg-purple-600' },
    red:    { bg: 'bg-red-50 dark:bg-red-900/20',        text: 'text-red-600 dark:text-red-400',       border: 'border-red-200 dark:border-red-800',       bar: 'bg-red-500',    headerBg: 'bg-red-600' },
    teal:   { bg: 'bg-teal-50 dark:bg-teal-900/20',      text: 'text-teal-600 dark:text-teal-400',     border: 'border-teal-200 dark:border-teal-800',     bar: 'bg-teal-500',   headerBg: 'bg-teal-600' },
};

const MetricCard: React.FC<MetricCardProps> = ({ number, title, icon, value, subtitle, formula, benchmark, frequency, color, trend, trendGood }) => {
    const c = colorMap[color];
    const [expanded, setExpanded] = useState(false);
    return (
        <div className={`bg-white dark:bg-surface-dark rounded-xl border ${c.border} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
            {/* Header */}
            <div className={`${c.headerBg} px-4 py-2.5 flex items-center gap-2`}>
                <span className="text-white font-black text-sm opacity-70">{number}</span>
                <span className="text-white font-bold text-xs uppercase tracking-wider flex-1">{title}</span>
                <span className="material-symbols-outlined text-white/70 text-lg">{icon}</span>
            </div>
            {/* Value */}
            <div className="px-4 pt-4 pb-3">
                <div className="flex items-end gap-2">
                    <span className={`text-2xl font-black ${c.text}`}>{value}</span>
                    {trend && (
                        <span className={`material-symbols-outlined text-lg mb-0.5 ${trendGood ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
                            {trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'trending_flat'}
                        </span>
                    )}
                </div>
                {subtitle && <p className="text-[10px] text-gray-500 mt-1">{subtitle}</p>}
            </div>
            {/* Expandable details */}
            <div className="px-4 pb-3">
                <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">{expanded ? 'expand_less' : 'expand_more'}</span>
                    {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                </button>
                {expanded && (
                    <div className={`mt-2 p-3 rounded-lg ${c.bg} space-y-2`}>
                        {formula && (
                            <div>
                                <span className="text-[9px] font-bold text-gray-500 uppercase">Fórmula</span>
                                <p className="text-[10px] text-gray-700 dark:text-gray-300">{formula}</p>
                            </div>
                        )}
                        {benchmark && (
                            <div>
                                <span className="text-[9px] font-bold text-gray-500 uppercase">Benchmark</span>
                                <p className="text-[10px] text-gray-700 dark:text-gray-300">{benchmark}</p>
                            </div>
                        )}
                        {frequency && (
                            <div>
                                <span className="text-[9px] font-bold text-gray-500 uppercase">Frequência</span>
                                <p className="text-[10px] text-gray-700 dark:text-gray-300">{frequency}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const InternalMetricsScreen: React.FC = () => {
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();

    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [orders, setOrders] = useState<Order[]>([]);
    const [allClients, setAllClients] = useState<Client[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [showManualPanel, setShowManualPanel] = useState(false);

    const storageKey = `${year}_${month}`;
    const [manualInputs, setManualInputs] = useState<ManualInputs>(getStoredInputs(storageKey));

    useEffect(() => {
        setManualInputs(getStoredInputs(storageKey));
    }, [storageKey]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ordersData, financeData, clientsData] = await Promise.all([
                orderService.getAll(),
                financeService.getAll(),
                clientService.getAll(true),
            ]);
            setOrders(ordersData);
            setAllClients(clientsData);
            setTransactions(financeData);
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
        } finally {
            setLoading(false);
        }
    };

    // ─── Filter orders for selected month ─────────────────────────────────────
    const monthOrders = useMemo(() => {
        return orders.filter(o => {
            let d: Date | null = null;
            if (o.timestamp) {
                if (o.timestamp.includes('/')) {
                    const parts = o.timestamp.split(',')[0].trim().split(' ')[0].split('/');
                    if (parts.length === 3) d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                } else {
                    d = new Date(o.timestamp);
                }
            }
            if (!d || isNaN(d.getTime())) return false;
            return d.getMonth() + 1 === month && d.getFullYear() === year;
        });
    }, [orders, month, year]);

    // ─── Filter finance transactions for selected month ───────────────────────
    const monthExpenses = useMemo(() => {
        return transactions.filter(t => {
            if (t.type !== TransactionType.Despesa) return false;
            let d: Date;
            if (t.date.includes('/')) {
                const p = t.date.split('/');
                d = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
            } else {
                d = new Date(t.date);
            }
            return d.getMonth() + 1 === month && d.getFullYear() === year;
        });
    }, [transactions, month, year]);

    // ─── Previous month orders (for trend comparison) ─────────────────────────
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthOrders = useMemo(() => {
        return orders.filter(o => {
            let d: Date | null = null;
            if (o.timestamp) {
                if (o.timestamp.includes('/')) {
                    const parts = o.timestamp.split(',')[0].trim().split(' ')[0].split('/');
                    if (parts.length === 3) d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                } else {
                    d = new Date(o.timestamp);
                }
            }
            if (!d || isNaN(d.getTime())) return false;
            return d.getMonth() + 1 === prevMonth && d.getFullYear() === prevYear;
        });
    }, [orders, prevMonth, prevYear]);

    // ─── COMPUTED METRICS ─────────────────────────────────────────────────────
    const totalRevenue = monthOrders.reduce((s, o) => s + (o.value || 0), 0);
    const totalOrders = monthOrders.length;
    const totalKg = monthOrders.reduce((s, o) => s + extractKgFromOrder(o), 0);
    const totalExpenseValue = monthExpenses.reduce((s, t) => s + t.amount, 0);

    // Previous month for trend
    const prevTotalRevenue = prevMonthOrders.reduce((s, o) => s + (o.value || 0), 0);
    const prevTotalOrders = prevMonthOrders.length;
    const prevTotalKg = prevMonthOrders.reduce((s, o) => s + extractKgFromOrder(o), 0);

    // 08: Ticket Médio
    const ticketMedio = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const prevTicketMedio = prevTotalOrders > 0 ? prevTotalRevenue / prevTotalOrders : 0;
    const ticketTrend = ticketMedio > prevTicketMedio ? 'up' : ticketMedio < prevTicketMedio ? 'down' : 'neutral';

    // 07: CPK - Custo por Quilo
    const totalCosts = totalExpenseValue + manualInputs.waterCost + manualInputs.energyCost + manualInputs.productCost + manualInputs.maintenanceCost;
    const cpk = totalKg > 0 ? totalCosts / totalKg : 0;

    // 04: Consumo por Quilo (água, energia, produto)
    const consumoAguaKg = totalKg > 0 ? manualInputs.waterCost / totalKg : 0;
    const consumoEnergiaKg = totalKg > 0 ? manualInputs.energyCost / totalKg : 0;
    const consumoProdutoKg = totalKg > 0 ? manualInputs.productCost / totalKg : 0;

    // 06: Taxa de Entrega no Prazo
    const onTimeRate = totalOrders > 0 ? (manualInputs.onTimeOrders / totalOrders) * 100 : 0;

    // 09: Margem por Tipo de Serviço — agrupamos por service
    const serviceBreakdown = useMemo(() => {
        const map: Record<string, { revenue: number; orders: number; kg: number }> = {};
        monthOrders.forEach(o => {
            const svc = o.service || 'Outros';
            if (!map[svc]) map[svc] = { revenue: 0, orders: 0, kg: 0 };
            map[svc].revenue += o.value || 0;
            map[svc].orders += 1;
            map[svc].kg += extractKgFromOrder(o);
        });
        return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue);
    }, [monthOrders]);

    // 10: Margem Bruta e Líquida
    const margemBruta = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;
    const totalFees = monthOrders.reduce((s, o) => s + (o.fee || 0), 0);
    const margemLiquida = totalRevenue > 0 ? ((totalRevenue - totalCosts - totalFees) / totalRevenue) * 100 : 0;

    // 12: Custo de Manutenção
    const custoManutencao = manualInputs.maintenanceCost;

    // 16: Taxa de Fidelização
    const uniqueClientsThisMonth = new Set(monthOrders.map(o => o.client.id)).size;
    const fidelizacao = uniqueClientsThisMonth > 0 ? (manualInputs.returningClients / uniqueClientsThisMonth) * 100 : 0;

    // 17: PPOH — kg por colaborador por hora  
    const ppoh = manualInputs.hoursWorked > 0 && manualInputs.numWorkers > 0
        ? totalKg / (manualInputs.hoursWorked * manualInputs.numWorkers)
        : 0;

    // ─── Manual input handler ─────────────────────────────────────────────────
    const updateManual = (field: keyof ManualInputs, val: number) => {
        const updated = { ...manualInputs, [field]: val };
        setManualInputs(updated);
        saveStoredInputs(storageKey, updated);
    };

    const ManualInputField: React.FC<{ label: string; field: keyof ManualInputs; icon: string; unit?: string }> = ({ label, field, icon, unit }) => (
        <div className="flex items-center gap-3 py-2">
            <span className="material-symbols-outlined text-gray-400 text-lg">{icon}</span>
            <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">{label}</label>
                <div className="flex items-center gap-2 mt-0.5">
                    {unit === 'R$' && <span className="text-xs text-gray-400 font-bold">R$</span>}
                    <input
                        type="number"
                        value={manualInputs[field] || ''}
                        onChange={e => updateManual(field, parseFloat(e.target.value) || 0)}
                        className="w-full h-7 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs px-2 focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                        step="0.01"
                        min="0"
                    />
                    {unit && unit !== 'R$' && <span className="text-xs text-gray-400">{unit}</span>}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            <Header title="Métricas de Controle Interno" onMenuClick={toggleSidebar} />

            <main className="flex-1 overflow-y-auto p-4 space-y-5">
                
                {/* Period selector + Manual Data toggle */}
                <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 uppercase">Período:</span>
                        <select 
                            value={month} 
                            onChange={e => setMonth(Number(e.target.value))}
                            className="h-8 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs px-2 text-gray-900 dark:text-white"
                        >
                            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <input 
                            type="number" 
                            value={year} 
                            onChange={e => setYear(Number(e.target.value))}
                            className="h-8 w-20 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs px-2 text-gray-900 dark:text-white"
                        />
                        <button onClick={loadData} className="h-8 px-3 rounded bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                            <span className="material-symbols-outlined text-sm">refresh</span>
                        </button>
                        <div className="flex-1" />
                        <button 
                            onClick={() => setShowManualPanel(!showManualPanel)}
                            className={`h-8 px-3 rounded text-xs font-bold flex items-center gap-1 transition-colors ${showManualPanel ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                        >
                            <span className="material-symbols-outlined text-sm">edit_note</span>
                            Dados Manuais
                        </button>
                    </div>

                    {/* Manual data input panel */}
                    {showManualPanel && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-[10px] text-gray-400 mb-3">
                                Insira os dados manuais para <strong>{MONTH_NAMES[month - 1]}/{year}</strong>. Os valores são salvos automaticamente.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
                                <ManualInputField label="Custo Água" field="waterCost" icon="water_drop" unit="R$" />
                                <ManualInputField label="Custo Energia" field="energyCost" icon="bolt" unit="R$" />
                                <ManualInputField label="Custo Produtos Químicos" field="productCost" icon="science" unit="R$" />
                                <ManualInputField label="Custo Manutenção" field="maintenanceCost" icon="build" unit="R$" />
                                <ManualInputField label="Horas Trabalhadas (mês)" field="hoursWorked" icon="schedule" unit="h" />
                                <ManualInputField label="Nº de Colaboradores" field="numWorkers" icon="groups" />
                                <ManualInputField label="Pedidos Entregues no Prazo" field="onTimeOrders" icon="check_circle" />
                                <ManualInputField label="Clientes que Retornaram" field="returningClients" icon="person_add" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Pedidos', value: totalOrders.toString(), icon: 'receipt_long', color: 'text-blue-500' },
                        { label: 'Faturamento', value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: 'payments', color: 'text-green-500' },
                        { label: 'Kg Processados', value: `${totalKg.toFixed(1)} kg`, icon: 'scale', color: 'text-purple-500' },
                        { label: 'Despesas', value: `R$ ${totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: 'money_off', color: 'text-red-500' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white dark:bg-surface-dark rounded-lg border border-gray-100 dark:border-gray-800 p-3 flex items-center gap-3">
                            <span className={`material-symbols-outlined ${s.color} text-xl`}>{s.icon}</span>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase">{s.label}</p>
                                <p className="text-sm font-black text-gray-800 dark:text-white">{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ─── SECTION: Métricas Operacionais ───────────────────────── */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-orange-500 text-lg">monitoring</span>
                        <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">Métricas Operacionais</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <MetricCard
                            number="04"
                            title="Consumo por Quilo"
                            icon="water_drop"
                            value={totalKg > 0 ? `R$ ${(consumoAguaKg + consumoEnergiaKg + consumoProdutoKg).toFixed(2)}/kg` : 'Sem dados'}
                            subtitle={totalKg > 0 ? `Água: R$ ${consumoAguaKg.toFixed(2)} | Energia: R$ ${consumoEnergiaKg.toFixed(2)} | Produto: R$ ${consumoProdutoKg.toFixed(2)}` : 'Preencha os dados manuais de água, energia e produto'}
                            formula="Consumo/kg = Gasto total do insumo no mês ÷ kg total processado no mês"
                            benchmark="Meta: estabelecer baseline nos 3 primeiros meses e reduzir 10% ao ano"
                            frequency="Mensal"
                            color="blue"
                        />
                        <MetricCard
                            number="06"
                            title="Taxa de Entrega no Prazo"
                            icon="schedule"
                            value={totalOrders > 0 ? `${onTimeRate.toFixed(1)}%` : '—'}
                            subtitle={`${manualInputs.onTimeOrders} de ${totalOrders} pedidos entregues no prazo`}
                            formula="Entrega no prazo = (Pedidos no prazo ÷ Total de pedidos) × 100"
                            benchmark="≥98% para alto desempenho. Abaixo de 90%: risco de perder clientes B2B"
                            frequency="Semanal"
                            color="green"
                            trend={onTimeRate >= 98 ? 'up' : onTimeRate >= 90 ? 'neutral' : 'down'}
                            trendGood={onTimeRate >= 95}
                        />
                        <MetricCard
                            number="17"
                            title="PPOH — Kg por Colaborador/Hora"
                            icon="speed"
                            value={ppoh > 0 ? `${ppoh.toFixed(1)} kg/h` : 'Sem dados'}
                            subtitle={ppoh > 0 ? `${totalKg.toFixed(0)} kg ÷ ${manualInputs.hoursWorked}h × ${manualInputs.numWorkers} colab.` : 'Preencha horas trabalhadas e nº de colaboradores'}
                            formula="PPOH = Total de kg processados ÷ (Total horas × Nº colaboradores)"
                            benchmark="Hospitality: 50–75 kg/h/operador. Bem gerenciadas: até 100 kg/h"
                            frequency="Semanal"
                            color="purple"
                        />
                    </div>
                </div>

                {/* ─── SECTION: Métricas Financeiras ────────────────────────── */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-green-500 text-lg">account_balance</span>
                        <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">Métricas Financeiras</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <MetricCard
                            number="07"
                            title="Custo por Quilo (CPK)"
                            icon="attach_money"
                            value={totalKg > 0 ? `R$ ${cpk.toFixed(2)}/kg` : 'Sem dados'}
                            subtitle={totalKg > 0 ? `Custos totais: R$ ${totalCosts.toFixed(2)} ÷ ${totalKg.toFixed(1)} kg` : 'Sem kg processados no período'}
                            formula="CPK = (Custos fixos + Custos variáveis) ÷ kg total processado"
                            benchmark="Global: R$ 4,20–R$ 5,80/kg. Se CPK > preço cobrado, está operando no prejuízo"
                            frequency="Mensal"
                            color="orange"
                            trend={cpk > 0 && cpk < 5.5 ? 'up' : cpk > 6 ? 'down' : 'neutral'}
                            trendGood={cpk > 0 && cpk < 5.5}
                        />
                        <MetricCard
                            number="08"
                            title="Ticket Médio por Pedido"
                            icon="receipt"
                            value={ticketMedio > 0 ? `R$ ${ticketMedio.toFixed(2)}` : '—'}
                            subtitle={`${totalOrders} pedidos = R$ ${totalRevenue.toFixed(2)} faturamento`}
                            formula="Ticket médio = Faturamento total ÷ Número de pedidos"
                            benchmark="Varia por mercado. Meta: crescer ticket com upsell (Completo → Expresso → Revitalize+)"
                            frequency="Mensal"
                            color="green"
                            trend={ticketTrend as 'up' | 'down' | 'neutral'}
                            trendGood={ticketTrend === 'up'}
                        />
                        <MetricCard
                            number="10"
                            title="Margem Bruta e Líquida"
                            icon="trending_up"
                            value={totalRevenue > 0 ? `${margemBruta.toFixed(1)}% / ${margemLiquida.toFixed(1)}%` : '—'}
                            subtitle={totalRevenue > 0 ? `Bruta: ${margemBruta.toFixed(1)}% | Líquida: ${margemLiquida.toFixed(1)}% (- taxas R$ ${totalFees.toFixed(2)})` : 'Sem faturamento no período'}
                            formula="Bruta = (Receita − Custos diretos) ÷ Receita × 100 | Líquida = Lucro líquido ÷ Receita × 100"
                            benchmark="Bruta: meta >40%. Líquida: meta 15–20% para pequenas lavanderias"
                            frequency="Mensal"
                            color="teal"
                            trend={margemLiquida >= 20 ? 'up' : margemLiquida >= 10 ? 'neutral' : 'down'}
                            trendGood={margemLiquida >= 15}
                        />
                        <MetricCard
                            number="12"
                            title="Custo Mensal de Manutenção"
                            icon="build"
                            value={custoManutencao > 0 ? `R$ ${custoManutencao.toFixed(2)}` : 'Não informado'}
                            subtitle={totalRevenue > 0 ? `${((custoManutencao / totalRevenue) * 100).toFixed(1)}% do faturamento` : 'Preencha no painel de dados manuais'}
                            formula="Custo manutenção = Soma de todas as intervenções técnicas no mês"
                            benchmark="Manutenção preventiva reduz 30-40% do custo total. Meta: ≥95% preventivas"
                            frequency="Mensal"
                            color="red"
                        />
                    </div>
                </div>

                {/* ─── SECTION: Métricas de Clientes ────────────────────────── */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-purple-500 text-lg">groups</span>
                        <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">Métricas de Clientes</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <MetricCard
                            number="16"
                            title="Taxa de Fidelização"
                            icon="loyalty"
                            value={uniqueClientsThisMonth > 0 ? `${fidelizacao.toFixed(1)}%` : '—'}
                            subtitle={`${manualInputs.returningClients} clientes retornaram de ${uniqueClientsThisMonth} únicos no mês`}
                            formula="Fidelização = (Clientes que voltaram ÷ Total de clientes ativos) × 100"
                            benchmark="Meta Lavê: >70% de retorno. +5% de fidelização = +25% a +95% lucratividade"
                            frequency="Mensal"
                            color="purple"
                            trend={fidelizacao >= 70 ? 'up' : fidelizacao >= 50 ? 'neutral' : 'down'}
                            trendGood={fidelizacao >= 60}
                        />
                    </div>
                </div>

                {/* ─── SECTION: Receita por Tipo de Serviço ─────────────────── */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-blue-500 text-lg">pie_chart</span>
                        <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">Receita por Tipo de Serviço (09)</h2>
                    </div>
                    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                        {/* Table header */}
                        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-[9px] font-bold text-gray-500 uppercase">
                            <div className="col-span-4">Serviço</div>
                            <div className="col-span-2 text-right">Pedidos</div>
                            <div className="col-span-2 text-right">Kg</div>
                            <div className="col-span-2 text-right">Receita</div>
                            <div className="col-span-2 text-right">% do Total</div>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-800">
                            {serviceBreakdown.length > 0 ? serviceBreakdown.map(([svc, data]) => {
                                const pct = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
                                return (
                                    <div key={svc} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <div className="col-span-4 text-xs font-bold text-gray-800 dark:text-white truncate">{svc}</div>
                                        <div className="col-span-2 text-xs text-gray-600 dark:text-gray-300 text-right">{data.orders}</div>
                                        <div className="col-span-2 text-xs text-gray-600 dark:text-gray-300 text-right">{data.kg.toFixed(1)}</div>
                                        <div className="col-span-2 text-xs font-bold text-gray-800 dark:text-white text-right">R$ {data.revenue.toFixed(2)}</div>
                                        <div className="col-span-2 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                                                </div>
                                                <span className="text-[10px] font-bold text-primary">{pct.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="p-6 text-center text-gray-400 text-xs">Nenhum pedido no período selecionado.</div>
                            )}
                        </div>
                        {/* Total row */}
                        {serviceBreakdown.length > 0 && (
                            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 font-bold text-xs">
                                <div className="col-span-4 text-gray-800 dark:text-white">TOTAL</div>
                                <div className="col-span-2 text-gray-600 dark:text-gray-300 text-right">{totalOrders}</div>
                                <div className="col-span-2 text-gray-600 dark:text-gray-300 text-right">{totalKg.toFixed(1)}</div>
                                <div className="col-span-2 text-gray-800 dark:text-white text-right">R$ {totalRevenue.toFixed(2)}</div>
                                <div className="col-span-2 text-primary text-right">100%</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Comparison with previous month */}
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-gray-400 text-lg">compare_arrows</span>
                        <h3 className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase">Comparativo com Mês Anterior ({MONTH_NAMES[prevMonth - 1]})</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Pedidos', current: totalOrders, prev: prevTotalOrders },
                            { label: 'Faturamento', current: totalRevenue, prev: prevTotalRevenue, prefix: 'R$ ' },
                            { label: 'Kg Processados', current: totalKg, prev: prevTotalKg, suffix: ' kg' },
                            { label: 'Ticket Médio', current: ticketMedio, prev: prevTicketMedio, prefix: 'R$ ' },
                        ].map((comp, i) => {
                            const diff = comp.prev > 0 ? ((comp.current - comp.prev) / comp.prev) * 100 : 0;
                            const isPositive = diff > 0;
                            return (
                                <div key={i} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">{comp.label}</p>
                                    <p className="text-sm font-black text-gray-800 dark:text-white mt-1">
                                        {comp.prefix || ''}{comp.current.toFixed(comp.prefix ? 2 : 0)}{comp.suffix || ''}
                                    </p>
                                    {comp.prev > 0 && (
                                        <p className={`text-[10px] font-bold mt-0.5 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                            {isPositive ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}%
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="h-6" />
            </main>
        </div>
    );
};
