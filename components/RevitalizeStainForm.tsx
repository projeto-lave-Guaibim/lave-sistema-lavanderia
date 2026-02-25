import React, { useState } from 'react';
import {
    RevitalizePiece, RevitalizeStain, RevitalizeLevel,
    REVITALIZE_LEVELS, calcRevitalizeTotal, stainValue, stainCharges, summarizeByLevel, generateRevitalizeLaudo
} from '../utils/revitalizeUtils';
import { generateRevitalizePDF } from '../utils/revitalizePdfGenerator';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
    pieces: RevitalizePiece[];
    onChange: (pieces: RevitalizePiece[]) => void;
    clientName?: string;
    clientPhone?: string;
    laudoRef?: string;
}

const genId = () => Math.random().toString(36).slice(2, 9);

// Cores dos níveis como pills compactos
const LEVEL_PILL: Record<RevitalizeLevel, string> = {
    essencial: 'bg-green-500 text-white',
    avancado:  'bg-orange-500 text-white',
    extremo:   'bg-purple-600 text-white',
};
const LEVEL_PILL_IDLE: Record<RevitalizeLevel, string> = {
    essencial: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-green-100 hover:text-green-700',
    avancado:  'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-orange-100 hover:text-orange-700',
    extremo:   'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-purple-100 hover:text-purple-700',
};
const LEVEL_SHORT: Record<RevitalizeLevel, string> = {
    essencial: 'Ess',
    avancado:  'Ava',
    extremo:   'Ext',
};
const LEVEL_VALUE_COLOR: Record<RevitalizeLevel, string> = {
    essencial: 'text-green-600 dark:text-green-400',
    avancado:  'text-orange-600 dark:text-orange-400',
    extremo:   'text-purple-600 dark:text-purple-400',
};

// ─── Compact Stain Row ────────────────────────────────────────────────────────
// Uma única linha de 32px por mancha — ultra compacto, tipo planilha
const StainRow: React.FC<{
    stain: RevitalizeStain;
    index: number;
    onUpdate: (s: RevitalizeStain) => void;
    onRemove: () => void;
}> = ({ stain, index, onUpdate, onRemove }) => {
    const val = stainValue(stain);

    return (
        <div className="flex items-center gap-1.5 px-2 h-8 border-b border-gray-100 dark:border-gray-800 last:border-0 group hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
            {/* Index */}
            <span className="text-[10px] text-gray-400 w-4 shrink-0 text-right">{index}.</span>

            {/* Level pills — E / A / X */}
            <div className="flex gap-0.5 shrink-0">
                {(Object.keys(REVITALIZE_LEVELS) as RevitalizeLevel[]).map(key => (
                    <button
                        key={key}
                        onClick={() => onUpdate({ ...stain, level: key })}
                        title={REVITALIZE_LEVELS[key].label}
                        className={`h-5 w-7 rounded text-[9px] font-bold transition-all ${
                            stain.level === key ? LEVEL_PILL[key] : LEVEL_PILL_IDLE[key]
                        }`}
                    >
                        {LEVEL_SHORT[key]}
                    </button>
                ))}
            </div>

            {/* Size toggle */}
            <div className="flex shrink-0 rounded overflow-hidden border border-gray-200 dark:border-gray-700 text-[9px] font-bold">
                <button
                    onClick={() => onUpdate({ ...stain, size: 'pequena' })}
                    title="≤ 20cm — 1 cobrança"
                    className={`px-1.5 h-5 transition-colors ${
                        stain.size === 'pequena'
                            ? 'bg-primary text-white'
                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >≤20</button>
                <button
                    onClick={() => onUpdate({ ...stain, size: 'grande' })}
                    title="> 20cm — 2 cobranças"
                    className={`px-1.5 h-5 border-l border-gray-200 dark:border-gray-700 transition-colors ${
                        stain.size === 'grande'
                            ? 'bg-primary text-white'
                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >&gt;20</button>
            </div>

            {/* Description */}
            <input
                type="text"
                value={stain.description || ''}
                onChange={e => onUpdate({ ...stain, description: e.target.value })}
                placeholder="Descrição da mancha (opcional)"
                className="flex-1 h-5 text-[11px] bg-transparent border-0 text-gray-700 dark:text-gray-300 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-0 min-w-0"
            />

            {/* Value */}
            <span className={`text-[10px] font-bold shrink-0 w-11 text-right ${LEVEL_VALUE_COLOR[stain.level]}`}>
                R${val.toFixed(2)}
            </span>
            {stain.size === 'grande' && (
                <span className="text-[9px] text-gray-400 shrink-0">×2</span>
            )}

            {/* Remove */}
            <button
                onClick={onRemove}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all shrink-0"
            >
                <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
        </div>
    );
};

// ─── Piece Card ───────────────────────────────────────────────────────────────
const PieceCard: React.FC<{
    piece: RevitalizePiece;
    index: number;
    onRemove: () => void;
    onAddStain: () => void;
    onUpdateStain: (stainId: string, updated: RevitalizeStain) => void;
    onRemoveStain: (stainId: string) => void;
}> = ({ piece, index, onRemove, onAddStain, onUpdateStain, onRemoveStain }) => {
    const [open, setOpen] = useState(true);
    const pieceTotal = piece.stains.reduce((s, st) => s + stainValue(st), 0);

    // Cor da borda esquerda baseado no nível dominante
    const countEss = piece.stains.filter(s => s.level === 'essencial').length;
    const countAva = piece.stains.filter(s => s.level === 'avancado').length;
    const countExt = piece.stains.filter(s => s.level === 'extremo').length;
    const topLevel = piece.stains.length === 0 ? '' : countExt >= countAva && countExt >= countEss ? 'extremo' : countAva >= countEss ? 'avancado' : 'essencial';
    const borderColor = topLevel === 'extremo' ? 'border-l-purple-400'
        : topLevel === 'avancado' ? 'border-l-orange-400'
        : piece.stains.length > 0 ? 'border-l-green-400'
        : 'border-l-gray-200 dark:border-l-gray-700';

    return (
        <div className={`bg-white dark:bg-[#1a222d] border border-gray-200 dark:border-gray-700 rounded border-l-[3px] ${borderColor} overflow-hidden`}>
            {/* Header da peça — clicável para expandir */}
            <div
                className="flex items-center px-2.5 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                onClick={() => setOpen(o => !o)}
            >
                <span className="material-symbols-outlined text-[14px] text-gray-400 mr-1.5">checkroom</span>
                <span className="text-xs font-bold text-gray-800 dark:text-white flex-1 truncate">
                    {index}. {piece.name}
                </span>

                {/* Badges de manchas por nível */}
                <div className="flex gap-1 items-center mr-2">
                    {piece.stains.length === 0 ? (
                        <span className="text-[9px] text-gray-400">sem manchas</span>
                    ) : (
                        <>
                            {(['essencial','avancado','extremo'] as RevitalizeLevel[]).map(lvl => {
                                const count = piece.stains.filter(s => s.level === lvl).length;
                                if (!count) return null;
                                return (
                                    <span key={lvl} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${LEVEL_PILL[lvl]}`}>
                                        {count}
                                    </span>
                                );
                            })}
                        </>
                    )}
                </div>

                {pieceTotal > 0 && (
                    <span className="text-[11px] font-bold text-primary mr-2 shrink-0">
                        R$ {pieceTotal.toFixed(2)}
                    </span>
                )}

                {/* Botão adicionar mancha direto no header */}
                <button
                    onClick={e => { e.stopPropagation(); onAddStain(); setOpen(true); }}
                    className="h-6 px-2 rounded text-[10px] font-bold bg-primary text-white hover:bg-primary/80 active:scale-95 transition-all mr-1 shrink-0 flex items-center gap-0.5 shadow-sm"
                    title="Adicionar mancha"
                >
                    <span className="text-[13px] leading-none">+</span> mancha
                </button>

                <button
                    onClick={e => { e.stopPropagation(); onRemove(); }}
                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                    title="Remover peça"
                >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                </button>

                <span className={`material-symbols-outlined text-[14px] text-gray-400 ml-1 transition-transform ${open ? '' : 'rotate-[-90deg]'}`}>
                    expand_more
                </span>
            </div>

            {/* Stain rows — colapsa ao clicar no header */}
            {open && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                    {piece.stains.length === 0 ? (
                        <div className="px-3 py-2 text-[10px] text-gray-400 text-center">
                            Clique em <strong>+ mancha</strong> para adicionar
                        </div>
                    ) : (
                        piece.stains.map((stain, idx) => (
                            <StainRow
                                key={stain.id}
                                stain={stain}
                                index={idx + 1}
                                onUpdate={updated => onUpdateStain(stain.id, updated)}
                                onRemove={() => onRemoveStain(stain.id)}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const RevitalizeStainForm: React.FC<Props> = ({ pieces, onChange, clientName, clientPhone, laudoRef }) => {
    const [newPieceName, setNewPieceName] = useState('');

    const addPiece = () => {
        if (!newPieceName.trim()) return;
        onChange([...pieces, { id: genId(), name: newPieceName.trim(), stains: [] }]);
        setNewPieceName('');
    };

    const removePiece = (id: string) => onChange(pieces.filter(p => p.id !== id));

    const updatePiece = (id: string, updater: (p: RevitalizePiece) => RevitalizePiece) =>
        onChange(pieces.map(p => p.id === id ? updater(p) : p));

    const addStain = (pid: string) =>
        updatePiece(pid, p => ({ ...p, stains: [...p.stains, { id: genId(), level: 'essencial', size: 'pequena' }] }));

    const updateStain = (pid: string, sid: string, updated: RevitalizeStain) =>
        updatePiece(pid, p => ({ ...p, stains: p.stains.map(s => s.id === sid ? updated : s) }));

    const removeStain = (pid: string, sid: string) =>
        updatePiece(pid, p => ({ ...p, stains: p.stains.filter(s => s.id !== sid) }));

    const total = calcRevitalizeTotal(pieces);
    const summary = summarizeByLevel(pieces);
    const totalStains = pieces.reduce((s, p) => s + p.stains.length, 0);

    const handleCopyLaudo = () => {
        const laudo = generateRevitalizeLaudo(clientName || 'Cliente', pieces, total);
        navigator.clipboard.writeText(laudo).then(() => alert('Laudo copiado para a área de transferência!'));
    };

    const handleDownloadPDF = async () => {
        try {
            await generateRevitalizePDF(clientName || 'Cliente', clientPhone || '', pieces, laudoRef);
        } catch (err: any) {
            alert('Erro ao gerar PDF: ' + err.message);
        }
    };

    return (
        <div className="space-y-2">

            {/* ── Legenda compacta em linha única ─────────────────────────── */}
            <div className="flex gap-1.5 flex-wrap">
                {(Object.entries(REVITALIZE_LEVELS) as [RevitalizeLevel, typeof REVITALIZE_LEVELS[RevitalizeLevel]][]).map(([key, lvl]) => (
                    <div key={key} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                        key === 'essencial' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/10 dark:border-green-800 dark:text-green-400'
                        : key === 'avancado' ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/10 dark:border-orange-800 dark:text-orange-400'
                        : 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/10 dark:border-purple-800 dark:text-purple-400'
                    }`}>
                        <span className="w-4 h-4 rounded text-[8px] flex items-center justify-center font-black bg-current text-white" style={{ color: 'inherit' }}>
                            {LEVEL_SHORT[key]}
                        </span>
                        {lvl.label} · R$ {lvl.price.toFixed(2)}
                    </div>
                ))}
                <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    ≤20cm = 1 cobr. · &gt;20cm = 2 cobr.
                </div>
            </div>

            {/* ── Cabeçalho da lista ───────────────────────────────────────── */}
            {pieces.length > 0 && (
                <div className="flex items-center px-2.5 py-0.5 text-[9px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700">
                    <span className="w-20 mr-1">&nbsp;</span>
                    <span className="flex-1">Descrição da mancha</span>
                    <span className="w-28 text-center">Nível</span>
                    <span className="w-12 text-center">Tam.</span>
                    <span className="w-14 text-right pr-5">Valor</span>
                </div>
            )}

            {/* ── Lista de peças ───────────────────────────────────────────── */}
            <div className="space-y-1.5">
                {pieces.map((piece, idx) => (
                    <PieceCard
                        key={piece.id}
                        piece={piece}
                        index={idx + 1}
                        onRemove={() => removePiece(piece.id)}
                        onAddStain={() => addStain(piece.id)}
                        onUpdateStain={(sid, upd) => updateStain(piece.id, sid, upd)}
                        onRemoveStain={sid => removeStain(piece.id, sid)}
                    />
                ))}
            </div>

            {/* ── Adicionar peça ───────────────────────────────────────────── */}
            <div className="flex gap-1.5">
                <input
                    type="text"
                    value={newPieceName}
                    onChange={e => setNewPieceName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addPiece()}
                    placeholder="Nome da peça  (ex: Camisa, Toalha, Lençol…)"
                    className="flex-1 h-8 rounded border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary focus:border-solid"
                />
                <button
                    onClick={addPiece}
                    disabled={!newPieceName.trim()}
                    className="h-8 px-3 rounded bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-30 transition-colors shrink-0"
                >
                    + Peça
                </button>
            </div>

            {/* ── Resumo + Ações ───────────────────────────────────────────── */}
            {totalStains > 0 && (
                <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a222d] overflow-hidden">
                    {/* Linha resumo por nível */}
                    <div className="px-3 py-2 space-y-0.5 border-b border-gray-100 dark:border-gray-800">
                        {summary.map(s => (
                            <div key={s.key} className="flex justify-between text-[11px]">
                                <span className="text-gray-500">
                                    {s.label}: <span className="text-gray-700 dark:text-gray-300">{s.count} mancha{s.count !== 1 ? 's' : ''}</span>
                                    <span className="text-gray-400"> ({s.charges} cobr.)</span>
                                </span>
                                <span className="font-bold text-gray-800 dark:text-white">R$ {s.subtotal.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Total + Botões lado a lado */}
                    <div className="flex items-center gap-2 px-3 py-2">
                        <div className="flex-1">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Total do Orçamento</span>
                            <div className="text-base font-black text-primary">R$ {total.toFixed(2)}</div>
                        </div>
                        <button
                            onClick={handleCopyLaudo}
                            className="h-8 px-3 rounded bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold transition-colors flex items-center gap-1.5 shrink-0"
                        >
                            <span className="material-symbols-outlined text-[14px]">content_copy</span>
                            WhatsApp
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="h-8 px-3 rounded bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-colors flex items-center gap-1.5 shrink-0"
                        >
                            <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                            PDF
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RevitalizeStainForm;
