/**
 * Formats a number to Brazilian currency format
 * @param value - The numeric value to format
 * @returns Formatted string in Brazilian currency format (R$ 1.000,00)
 */
export const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
        return 'R$ 0,00';
    }

    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

/**
 * Formats a number to Brazilian currency format without the R$ symbol
 * @param value - The numeric value to format
 * @returns Formatted string without currency symbol (1.000,00)
 */
export const formatCurrencyValue = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
        return '0,00';
    }

    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};
