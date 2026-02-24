// Taxa base cobrada no ato de CADA pedido
export const BASE_RATE = 15.90;

// Tabela de faixas mensal
export const CONTRACT_TIERS = [
    { label: 'Faixa 1 (até 59 kg)',   maxKg: 59,       price: 15.90 },
    { label: 'Faixa 2 (60–199 kg)',   maxKg: 199,      price: 14.90 },
    { label: 'Faixa 3 (200 kg+)',     maxKg: Infinity,  price: 13.90 },
];

/**
 * Retorna a taxa correta e o valor que DEVERIA ter sido cobrado pelo total do mês.
 */
export const calculateContractPrice = (totalKg: number): { rate: number; total: number; tierLabel: string } => {
    let tier = CONTRACT_TIERS[0];

    if (totalKg >= 200) {
        tier = CONTRACT_TIERS[2];
    } else if (totalKg >= 60) {
        tier = CONTRACT_TIERS[1];
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
