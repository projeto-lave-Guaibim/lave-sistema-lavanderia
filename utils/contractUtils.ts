import { ContractRule, contractRuleService } from '../services/contractRuleService';

// Taxa base cobrada no ato de CADA pedido
export let BASE_RATE = 15.90;

// Tabela de faixas mensal
export let CONTRACT_TIERS = [
    { label: 'Faixa 1 (até 59 kg)',   minKg: 0,   price: 15.90 },
    { label: 'Faixa 2 (60–199 kg)',   minKg: 60,  price: 14.90 },
    { label: 'Faixa 3 (200 kg+)',     minKg: 200, price: 13.90 },
];

let isLoaded = false;

export const loadContractRules = async () => {
    if (isLoaded) return;
    try {
        const rules = await contractRuleService.getAll();
        if (rules.length > 0) {
            const baseRateRule = rules.find(r => r.type === 'base_rate');
            if (baseRateRule) {
                BASE_RATE = baseRateRule.price;
            }

            const tiers = rules.filter(r => r.type === 'tier').map(r => ({
                label: r.label,
                minKg: r.min_kg,
                price: r.price
            }));
            
            if (tiers.length > 0) {
                CONTRACT_TIERS = tiers.sort((a, b) => a.minKg - b.minKg);
            }
        }
        isLoaded = true;
    } catch(err) {
        console.error("Failed to load contract rules", err);
    }
};

export const clearRulesCache = () => {
    isLoaded = false;
};

/**
 * Retorna a taxa correta e o valor que DEVERIA ter sido cobrado pelo total do mês.
 */
export const calculateContractPrice = (totalKg: number): { rate: number; total: number; tierLabel: string } => {
    let tier = CONTRACT_TIERS[0];

    // Find the highest tier that the user qualifies for
    // Because CONTRACT_TIERS is sorted ascending by minKg, 
    // we iterate and keep updating 'tier' as long as totalKg >= current.minKg
    for (const t of CONTRACT_TIERS) {
        if (totalKg >= t.minKg) {
            tier = t;
        }
    }

    return {
        rate: tier.price,
        total: totalKg * tier.price,
        tierLabel: tier.label,
    };
};

/**
 * Calcula o crédito do cliente:
 * alreadyCharged = soma dos pedidos do mês (cobrados a BASE_RATE)
 * shouldCharge   = totalKg * taxa da faixa
 * credit         = alreadyCharged − shouldCharge (positivo = cliente tem crédito)
 */
export const calculateCredit = (
    totalKg: number,
    alreadyCharged: number
): { rate: number; shouldCharge: number; credit: number; tierLabel: string } => {
    const { rate, total: shouldCharge, tierLabel } = calculateContractPrice(totalKg);
    const credit = parseFloat((alreadyCharged - shouldCharge).toFixed(2));
    return { rate, shouldCharge, credit, tierLabel };
};
