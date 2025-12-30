export interface FeeConfig {
    [key: string]: number;
}

const STORAGE_KEY = 'lave_fee_config';

const DEFAULT_FEES: FeeConfig = {
    'Pix': 0,
    'Cartão de Débito': 0,
    'Dinheiro': 0,
    // Add defaults for installments
    ...Array.from({ length: 12 }, (_, i) => ({ [`Cartão de Crédito (${i + 1}x)`]: 0 })).reduce((a, b) => ({ ...a, ...b }), {})
};

export const feeUtils = {
    getFees: (): FeeConfig => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return DEFAULT_FEES;
            return { ...DEFAULT_FEES, ...JSON.parse(stored) };
        } catch (error) {
            console.error('Error loading fees', error);
            return DEFAULT_FEES;
        }
    },

    saveFees: (fees: FeeConfig) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fees));
        } catch (error) {
            console.error('Error saving fees', error);
        }
    },

    calculateNetValue: (amount: number, paymentMethod: string, fees: FeeConfig): number => {
        const feePercentage = fees[paymentMethod] || 0;
        const discount = (amount * feePercentage) / 100;
        return amount - discount;
    }
};
