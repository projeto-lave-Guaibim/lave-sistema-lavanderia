import React, { useState, useEffect } from 'react';
import { feeUtils, FeeConfig } from '../utils/feeUtils';

interface FeeConfigModalProps {
    onClose: () => void;
    onSave: () => void;
}

export const FeeConfigModal: React.FC<FeeConfigModalProps> = ({ onClose, onSave }) => {
    const [fees, setFees] = useState<FeeConfig>(feeUtils.getFees());

    const handleChange = (method: string, value: string) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) return;
        setFees(prev => ({ ...prev, [method]: numValue }));
    };

    const handleSave = () => {
        feeUtils.saveFees(fees);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="w-full max-w-md bg-white dark:bg-[#1a222d] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 my-8 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <h3 className="text-xl font-bold text-[#111418] dark:text-white">Taxas de Pagamento</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Defina a porcentagem da taxa cobrada por cada método de pagamento. 
                        O valor líquido será calculado automaticamente no Fluxo de Caixa.
                    </p>

                    <div className="space-y-4">
                        {/* Standard Methods */}
                        {Object.keys(fees)
                            .filter(k => !k.includes('Cartão de Crédito'))
                            .map(method => (
                            <div key={method} className="flex items-center justify-between gap-4">
                                <label className="text-base font-medium text-[#111418] dark:text-white flex-1">{method}</label>
                                <div className="relative w-32">
                                    <input
                                        type="number"
                                        value={fees[method]}
                                        onChange={(e) => handleChange(method, e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark px-4 py-2 pr-8 text-right font-bold focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                                        step="0.01"
                                        min="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                                </div>
                            </div>
                        ))}

                        {/* Credit Card Section */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-wide">Cartão de Crédito (Parcelado)</h4>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.keys(fees)
                                    .filter(k => k.match(/Cartão de Crédito \(\d+x\)/)) // Strict match for installments
                                    .sort((a, b) => {
                                        const getNum = (str: string) => parseInt(str.match(/\d+/)?.[0] || '0');
                                        return getNum(a) - getNum(b);
                                    })
                                    .map(method => {
                                        const installments = method.match(/\d+/)?.[0] || '0';
                                        return (
                                            <div key={method} className="flex flex-col gap-1">
                                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 text-center">{installments}x</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={fees[method]}
                                                        onChange={(e) => handleChange(method, e.target.value)}
                                                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark px-2 py-2 pr-6 text-center font-bold focus:ring-primary focus:border-primary text-sm text-gray-900 dark:text-white"
                                                        step="0.01"
                                                        min="0"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 p-6 pt-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
                    <button 
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-1 h-12 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark transition-colors"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};
