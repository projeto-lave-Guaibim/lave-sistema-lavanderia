// ─── Lavê Revitalize+ — Recuperação Especializada de Manchas ─────────────────

export const REVITALIZE_LEVELS = {
    essencial: {
        label: 'Essencial',
        price: 4.90,
        color: 'green',
        description: 'Manchas recentes e fáceis',
        examples: 'Respingo, suor, poeira, sujeira leve',
        icon: 'water_drop',
    },
    avancado: {
        label: 'Avançado',
        price: 9.90,
        color: 'orange',
        description: 'Média dificuldade de remoção',
        examples: 'Maquiagem, protetor solar, vinho, mofo inicial',
        icon: 'science',
    },
    extremo: {
        label: 'Extremo',
        price: 24.90,
        color: 'purple',
        description: 'Manchas difíceis ou substância agressiva',
        examples: 'Mofo avançado, protetor solar oxidado, ferrugem, sangue seco',
        icon: 'warning',
    },
} as const;

export type RevitalizeLevel = keyof typeof REVITALIZE_LEVELS;
export type RevitalizeStainSize = 'pequena' | 'grande'; // ≤20cm = 1 cobrança | >20cm = 2 cobranças

export interface RevitalizeStain {
    id: string;
    level: RevitalizeLevel;
    size: RevitalizeStainSize;
    description?: string;
}

export interface RevitalizePiece {
    id: string;
    name: string; // ex: "Camisa branca", "Toalha"
    stains: RevitalizeStain[];
}

/** Uma mancha >20cm conta como 2 cobranças */
export const stainCharges = (stain: RevitalizeStain): number =>
    stain.size === 'grande' ? 2 : 1;

/** Valor de uma mancha */
export const stainValue = (stain: RevitalizeStain): number =>
    stainCharges(stain) * REVITALIZE_LEVELS[stain.level].price;

/** Valor total de todas as peças */
export const calcRevitalizeTotal = (pieces: RevitalizePiece[]): number =>
    pieces.reduce((sum, piece) =>
        sum + piece.stains.reduce((s, stain) => s + stainValue(stain), 0), 0
    );

/** Summary de manchas por nível */
export const summarizeByLevel = (pieces: RevitalizePiece[]) => {
    const allStains = pieces.flatMap(p => p.stains);
    return Object.entries(REVITALIZE_LEVELS).map(([key, level]) => {
        const levelStains = allStains.filter(s => s.level === key as RevitalizeLevel);
        const charges = levelStains.reduce((s, st) => s + stainCharges(st), 0);
        return {
            key: key as RevitalizeLevel,
            label: level.label,
            price: level.price,
            count: levelStains.length,
            charges,
            subtotal: charges * level.price,
        };
    }).filter(l => l.count > 0);
};

/** Gera texto do laudo para WhatsApp */
export const generateRevitalizeLaudo = (
    clientName: string,
    pieces: RevitalizePiece[],
    total: number,
    month?: string,
): string => {
    const date = new Date().toLocaleDateString('pt-BR');
    const pieceCount = pieces.length;
    const totalStains = pieces.reduce((s, p) => s + p.stains.length, 0);
    const summary = summarizeByLevel(pieces);

    const piecesDetail = pieces.map(p => {
        const stainsText = p.stains.map((st, i) =>
            `  ${i + 1}. ${REVITALIZE_LEVELS[st.level].label} — ${st.size === 'grande' ? '>20cm (2 cobranças)' : '≤20cm (1 cobrança)'} — R$ ${stainValue(st).toFixed(2)}`
        ).join('\n');
        return `📦 *${p.name}*\n${stainsText}`;
    }).join('\n\n');

    const summaryText = summary.map(s =>
        `• ${s.label}: ${s.count} mancha(s), ${s.charges} cobrança(s) — R$ ${s.subtotal.toFixed(2)}`
    ).join('\n');

    return [
        `*Lavê Revitalize+ — Laudo de Manchas*`,
        `📅 Data: ${date}`,
        `👤 Cliente: ${clientName}`,
        ``,
        `📊 *Resumo da Triagem:*`,
        `🔹 Peças analisadas: ${pieceCount}`,
        `🔹 Manchas identificadas: ${totalStains}`,
        ``,
        summaryText,
        ``,
        `━━━━━━━━━━━━━━━━━━━━`,
        `💰 *Total do Orçamento: R$ ${total.toFixed(2)}*`,
        `━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `📋 *Detalhamento por Peça:*`,
        piecesDetail,
        ``,
        `⚠️ _Cobramos apenas pelo que for removido. Responda esse laudo para aprovar o tratamento._`,
        ``,
        `Lavê Lavanderia — Guaibim 🌊`,
    ].join('\n');
};

/** Serializa peças para salvar no campo details do pedido */
export const serializeRevitalize = (pieces: RevitalizePiece[]): string => {
    const total = calcRevitalizeTotal(pieces);
    const totalStains = pieces.reduce((s, p) => s + p.stains.length, 0);
    return `[Revitalize+ | ${pieces.length} peça(s) | ${totalStains} mancha(s) | R$ ${total.toFixed(2)}] ${JSON.stringify(pieces)}`;
};
