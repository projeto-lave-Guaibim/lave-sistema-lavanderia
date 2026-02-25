import React, { useState } from 'react';
import {
    RevitalizePiece, RevitalizeStain, RevitalizeLevel, RevitalizeStainSize,
    REVITALIZE_LEVELS, calcRevitalizeTotal, stainValue, stainCharges, summarizeByLevel, generateRevitalizeLaudo
} from '../utils/revitalizeUtils';
import { generateRevitalizePDF } from '../utils/revitalizePdfGenerator';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
    pieces: RevitalizePiece[];
    onChange: (pieces: RevitalizePiece[]) => void;
    clientName?: string;
    clientPhone?: string;
    laudoRef?: string; // pedido ID ou número de referência
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2, 9);

const LEVEL_COLORS: Record<RevitalizeLevel, string> = {
    essencial: 'border-green-400 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    avancado:  'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    extremo:   'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
};

const LEVEL_SELECTED: Record<RevitalizeLevel, string> = {
    essencial: 'bg-green-500 border-green-500 text-white',
    avancado:  'bg-orange-500 border-orange-500 text-white',
    extremo:   'bg-purple-600 border-purple-600 text-white',
};

// ─── Stain Row ────────────────────────────────────────────────────────────────
const StainRow: React.FC<{
    stain: RevitalizeStain;
    index: number;
    onUpdate: (s: RevitalizeStain) => void;
    onRemove: () => void;
}> = ({ stain, index, onUpdate, onRemove }) => {
    const level = REVITALIZE_LEVELS[stain.level];

    return (
        <div className="border border-gray-100 dark:border-gray-800 rounded overflow-hidden">
            {/* Level selector */}
            <div className="flex border-b border-gray-100 dark:border-gray-800">
                {(Object.keys(REVITALIZE_LEVELS) as RevitalizeLevel[]).map(key => {
                    const selected = stain.level === key;
                    return (
                        <button
                            key={key}
                            onClick={() => onUpdate({ ...stain, level: key })}
                            className={`flex-1 py-1.5 text-[10px] font-bold border-b-2 transition-all ${
                                selected
                                    ? (key === 'essencial' ? 'border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                                     : key === 'avancado' ? 'border-orange-500 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                                     : 'border-purple-600 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20')
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {REVITALIZE_LEVELS[key].label}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center gap-2 px-2.5 py-2">
                {/* Size toggle */}
                <div className="flex rounded border border-gray-200 dark:border-gray-700 overflow-hidden text-[10px] font-bold shrink-0">
                    <button
                        onClick={() => onUpdate({ ...stain, size: 'pequena' })}
                        className={`px-2 py-1 transition-colors ${stain.size === 'pequena' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        title="Até 20cm — 1 cobrança"
                    >
                        ≤20cm
                    </button>
                    <button
                        onClick={() => onUpdate({ ...stain, size: 'grande' })}
                        className={`px-2 py-1 transition-colors border-l border-gray-200 dark:border-gray-700 ${stain.size === 'grande' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        title="Acima de 20cm — 2 cobranças"
                    >
                        &gt;20cm
                    </button>
                </div>

                {/* Description */}
                <input
                    type="text"
                    value={stain.description || ''}
                    onChange={e => onUpdate({ ...stain, description: e.target.value })}
                    placeholder="Descrição (opcional)"
                    className="flex-1 h-6 border-0 bg-transparent text-xs text-gray-700 dark:text-gray-300 placeholder:text-gray-300 focus:ring-0 focus:outline-none"
                />

                {/* Value badge */}
                <span className="text-[10px] font-bold text-primary shrink-0 w-12 text-right">
                    R$ {stainValue(stain).toFixed(2)}
                </span>
                {stain.size === 'grande' && (
                    <span className="text-[9px] text-gray-400 shrink-0">×2</span>
                )}

                {/* Remove */}
                <button onClick={onRemove} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const RevitalizeStainForm: React.FC<Props> = ({ pieces, onChange, clientName, clientPhone, laudoRef }) => {
    const [newPieceName, setNewPieceName] = useState('');
    const [showLaudoPreview, setShowLaudoPreview] = useState(false);

    const addPiece = () => {
        if (!newPieceName.trim()) return;
        onChange([...pieces, { id: genId(), name: newPieceName.trim(), stains: [] }]);
        setNewPieceName('');
    };

    const removePiece = (pieceId: string) => {
        onChange(pieces.filter(p => p.id !== pieceId));
    };

    const updatePiece = (pieceId: string, updater: (p: RevitalizePiece) => RevitalizePiece) => {
        onChange(pieces.map(p => p.id === pieceId ? updater(p) : p));
    };

    const addStain = (pieceId: string) => {
        updatePiece(pieceId, p => ({
            ...p,
            stains: [...p.stains, { id: genId(), level: 'essencial', size: 'pequena' }]
        }));
    };

    const updateStain = (pieceId: string, stainId: string, updated: RevitalizeStain) => {
        updatePiece(pieceId, p => ({
            ...p,
            stains: p.stains.map(s => s.id === stainId ? updated : s)
        }));
    };

    const removeStain = (pieceId: string, stainId: string) => {
        updatePiece(pieceId, p => ({
            ...p,
            stains: p.stains.filter(s => s.id !== stainId)
        }));
    };

    const total = calcRevitalizeTotal(pieces);
    const summary = summarizeByLevel(pieces);
    const totalStains = pieces.reduce((s, p) => s + p.stains.length, 0);

    const handleCopyLaudo = () => {
        const laudo = generateRevitalizeLaudo(clientName || 'Cliente', pieces, total);
        navigator.clipboard.writeText(laudo).then(() => {
            alert('Laudo copiado! Cole no WhatsApp do cliente.');
        });
    };

    const handleDownloadPDF = async () => {
        try {
            await generateRevitalizePDF(
                clientName || 'Cliente',
                clientPhone || '',
                pieces,
                laudoRef,
            );
        } catch (err: any) {
            alert('Erro ao gerar PDF: ' + err.message);
        }
    };

    return (
        <div className="space-y-3">
            {/* Header info */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded p-3">
                <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                    ℹ️ Lavê Revitalize+
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    Cobrança por mancha. Manchas <strong>≤20cm = 1 cobrança</strong>, <strong>&gt;20cm = 2 cobranças</strong>. Só cobra se houver remoção visível.
                </p>
            </div>

            {/* Level legend */}
            <div className="grid grid-cols-3 gap-1.5">
                {(Object.entries(REVITALIZE_LEVELS) as [RevitalizeLevel, typeof REVITALIZE_LEVELS[RevitalizeLevel]][]).map(([key, level]) => (
                    <div key={key} className={`rounded border px-2 py-1.5 ${LEVEL_COLORS[key]}`}>
                        <p className="text-[10px] font-bold">{level.label} — R$ {level.price.toFixed(2)}</p>
                        <p className="text-[9px] opacity-75 leading-tight mt-0.5">{level.examples}</p>
                    </div>
                ))}
            </div>

            {/* Pieces list */}
            {pieces.map(piece => (
                <div key={piece.id} className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                    {/* Piece header */}
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-[#1e2a38] border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-gray-500">checkroom</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white">{piece.name}</span>
                            {piece.stains.length > 0 && (
                                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                                    {piece.stains.length} mancha{piece.stains.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary">
                                R$ {piece.stains.reduce((s, st) => s + stainValue(st), 0).toFixed(2)}
                            </span>
                            <button onClick={() => removePiece(piece.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                        </div>
                    </div>

                    {/* Stains */}
                    <div className="p-2 space-y-1.5">
                        {piece.stains.length === 0 && (
                            <p className="text-[10px] text-gray-400 text-center py-1">
                                Nenhuma mancha adicionada
                            </p>
                        )}
                        {piece.stains.map((stain, idx) => (
                            <StainRow
                                key={stain.id}
                                stain={stain}
                                index={idx + 1}
                                onUpdate={updated => updateStain(piece.id, stain.id, updated)}
                                onRemove={() => removeStain(piece.id, stain.id)}
                            />
                        ))}
                        <button
                            onClick={() => addStain(piece.id)}
                            className="w-full h-7 border border-dashed border-gray-300 dark:border-gray-700 rounded text-[10px] font-bold text-gray-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[13px]">add</span>
                            Adicionar Mancha
                        </button>
                    </div>
                </div>
            ))}

            {/* Add piece */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newPieceName}
                    onChange={e => setNewPieceName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addPiece()}
                    placeholder="Nome da peça (ex: Camisa branca, Toalha)"
                    className="flex-1 h-8 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <button
                    onClick={addPiece}
                    disabled={!newPieceName.trim()}
                    className="h-8 px-3 rounded bg-primary text-white text-xs font-bold hover:bg-primary-dark disabled:opacity-40 transition-colors"
                >
                    + Peça
                </button>
            </div>

            {/* Summary + Laudo */}
            {totalStains > 0 && (
                <div className="bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                    <div className="px-3 py-1.5 bg-gray-50 dark:bg-[#1e2a38] border-b border-gray-200 dark:border-gray-700">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Resumo do Orçamento</span>
                    </div>
                    <div className="p-3 space-y-1">
                        {summary.map(s => (
                            <div key={s.key} className="flex justify-between text-xs">
                                <span className="text-gray-500">
                                    {s.label}: {s.count} mancha{s.count !== 1 ? 's' : ''} ({s.charges} cobrança{s.charges !== 1 ? 's' : ''})
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white">R$ {s.subtotal.toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="border-t border-gray-100 dark:border-gray-800 pt-2 flex justify-between">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Total do Orçamento</span>
                            <span className="text-sm font-bold text-primary">R$ {total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="px-3 pb-3">
                        <button
                            onClick={handleCopyLaudo}
                            className="w-full h-8 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-[14px]">content_copy</span>
                            Copiar Laudo para WhatsApp
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="w-full h-8 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                            Baixar Laudo PDF
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RevitalizeStainForm;
