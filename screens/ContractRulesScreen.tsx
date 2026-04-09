import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { contractRuleService, ContractRule } from '../services/contractRuleService';
import { clearRulesCache, loadContractRules } from '../utils/contractUtils';

export const ContractRulesScreen: React.FC = () => {
    const { toggleSidebar } = useOutletContext<{ toggleSidebar: () => void }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // State for rules
    const [baseRateRule, setBaseRateRule] = useState<ContractRule | null>(null);
    const [tierRules, setTierRules] = useState<ContractRule[]>([]);

    // Form states
    const [baseRateInput, setBaseRateInput] = useState('');
    
    // Tier Form
    const [editingTierId, setEditingTierId] = useState<string | null>(null);
    const [tierLabel, setTierLabel] = useState('');
    const [tierMinKg, setTierMinKg] = useState('');
    const [tierPrice, setTierPrice] = useState('');
    const [showTierForm, setShowTierForm] = useState(false);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const rules = await contractRuleService.getAll();
            const baseRule = rules.find(r => r.type === 'base_rate') || null;
            const tiers = rules.filter(r => r.type === 'tier').sort((a, b) => a.min_kg - b.min_kg);
            
            setBaseRateRule(baseRule);
            if (baseRule) {
                setBaseRateInput(baseRule.price.toString());
            }
            setTierRules(tiers);
        } catch (error) {
            console.error(error);
            alert('Erro ao carregar configurações de contratos.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBaseRate = async () => {
        const val = parseFloat(baseRateInput.replace(',', '.'));
        if (isNaN(val) || val <= 0) {
            alert('Insira um valor válido para a Taxa Base.');
            return;
        }

        setSubmitting(true);
        try {
            if (baseRateRule) {
                await contractRuleService.update(baseRateRule.id, { price: val });
            } else {
                await contractRuleService.create({
                    type: 'base_rate',
                    label: 'Taxa Base (Ato do Pedido)',
                    min_kg: 0,
                    price: val
                });
            }
            alert('Taxa Base salva com sucesso!');
            clearRulesCache();
            await loadContractRules();
            fetchRules();
        } catch(err) {
            alert('Erro ao salvar taxa base.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveTier = async () => {
        if (!tierLabel.trim()) { alert('Informe o nome da faixa.'); return; }
        const minKg = parseFloat(tierMinKg);
        const price = parseFloat(tierPrice.replace(',', '.'));

        if (isNaN(minKg) || minKg < 0) { alert('Mínimo KG inválido.'); return; }
        if (isNaN(price) || price <= 0) { alert('Preço inválido.'); return; }

        setSubmitting(true);
        try {
            const data = {
                type: 'tier' as const,
                label: tierLabel,
                min_kg: minKg,
                price: price
            };

            if (editingTierId) {
                await contractRuleService.update(editingTierId, data);
            } else {
                await contractRuleService.create(data);
            }

            clearRulesCache();
            await loadContractRules();
            setEditingTierId(null);
            setShowTierForm(false);
            setTierLabel('');
            setTierMinKg('');
            setTierPrice('');
            fetchRules();
        } catch(err) {
            console.error(err);
            alert('Erro ao salvar faixa.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditTier = (tier: ContractRule) => {
        setEditingTierId(tier.id);
        setTierLabel(tier.label);
        setTierMinKg(tier.min_kg.toString());
        setTierPrice(tier.price.toString());
        setShowTierForm(true);
    };

    const handleDeleteTier = async (id: string) => {
        if (!confirm('Deseja realmente remover esta faixa? O sistema pode falhar se não houver faixas suficientes configuradas.')) return;
        setSubmitting(true);
        try {
            await contractRuleService.delete(id);
            clearRulesCache();
            await loadContractRules();
            fetchRules();
        } catch(err) {
            alert('Erro ao excluir faixa.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Header 
                title="Regras de Contrato" 
                onMenuClick={toggleSidebar} 
                rightActions={
                    <button onClick={fetchRules} className="flex size-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined">refresh</span>
                    </button>
                }
            />

            <main className="flex-1 overflow-y-auto p-4 pb-24 bg-[#eef0f3] dark:bg-[#111821]">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-6">
                        
                        {/* Section 1: Base Rate */}
                        <div className="bg-white dark:bg-[#1a222d] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <span className="material-symbols-outlined">payments</span>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Taxa Base (Cobrada no Pedido)</h2>
                                    <p className="text-xs text-gray-500">Valor provisório cobrado pelo quilo no momento do pedido. No final do mês, é feito o acerto.</p>
                                </div>
                            </div>
                            <div className="p-5 flex items-end gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Valor por Kg (R$)</label>
                                    <input 
                                        type="number"
                                        placeholder="0.00"
                                        step="0.01"
                                        value={baseRateInput}
                                        onChange={(e) => setBaseRateInput(e.target.value)}
                                        className="w-full text-lg h-12 font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                                    />
                                </div>
                                <button
                                    onClick={handleSaveBaseRate}
                                    disabled={submitting}
                                    className="h-12 px-6 rounded-xl bg-primary text-white font-bold flex items-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined">save</span>
                                    {submitting ? 'Salvando...' : 'Salvar Taxa Base'}
                                </button>
                            </div>
                        </div>

                        {/* Section 2: Tiers */}
                        <div className="bg-white dark:bg-[#1a222d] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                        <span className="material-symbols-outlined">bar_chart</span>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Faixas Mensais (Tiers)</h2>
                                        <p className="text-xs text-gray-500">As faixas que determinam o valor final com base no volume (Kg mensal).</p>
                                    </div>
                                </div>
                                {!showTierForm && (
                                    <button 
                                        onClick={() => {
                                            setEditingTierId(null);
                                            setTierLabel('');
                                            setTierMinKg('');
                                            setTierPrice('');
                                            setShowTierForm(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-bold hover:bg-primary-light transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span> Nova Faixa
                                    </button>
                                )}
                            </div>

                            {/* Tier Form */}
                            {showTierForm && (
                                <div className="p-5 bg-gray-50 dark:bg-[#1e2a38] border-b border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-4 duration-300">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-gray-900 dark:text-white">{editingTierId ? 'Editar Faixa' : 'Cadastrar Faixa'}</h3>
                                        <button onClick={() => setShowTierForm(false)} className="text-gray-400 hover:text-gray-600">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Nome da Faixa</label>
                                            <input 
                                                type="text"
                                                placeholder="Ex: Faixa 1 (até 59 kg)"
                                                value={tierLabel}
                                                onChange={(e) => setTierLabel(e.target.value)}
                                                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">A partir de (Kg)</label>
                                            <input 
                                                type="number"
                                                placeholder="0.00"
                                                value={tierMinKg}
                                                onChange={(e) => setTierMinKg(e.target.value)}
                                                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Preço (R$/Kg)</label>
                                            <input 
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={tierPrice}
                                                onChange={(e) => setTierPrice(e.target.value)}
                                                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleSaveTier}
                                        disabled={submitting}
                                        className="w-full h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-sm">check</span> 
                                        {submitting ? 'Salvando...' : 'Salvar Faixa'}
                                    </button>
                                </div>
                            )}

                            {/* Tiers List */}
                            <div className="p-3">
                                {tierRules.length === 0 ? (
                                    <p className="text-center text-gray-500 py-6">Nenhuma faixa de preço cadastrada.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {tierRules.map((tier, index) => (
                                            <div key={tier.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-500 text-sm">
                                                        #{index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white">{tier.label}</p>
                                                        <p className="text-xs text-gray-500">Mínimo: {tier.min_kg} kg</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <span className="font-bold text-primary text-lg">R$ {tier.price.toFixed(2)}/kg</span>
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            onClick={() => handleEditTier(tier)}
                                                            className="flex size-8 items-center justify-center rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                            title="Editar"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">edit</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteTier(tier.id)}
                                                            className="flex size-8 items-center justify-center rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </main>
        </>
    );
};
