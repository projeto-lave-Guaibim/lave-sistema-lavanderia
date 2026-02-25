import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    RevitalizePiece,
    REVITALIZE_LEVELS,
    stainValue,
    stainCharges,
    calcRevitalizeTotal,
    summarizeByLevel,
} from './revitalizeUtils';

// ─── Cores da identidade Lavê ─────────────────────────────────────────────────
const PRIMARY:    [number, number, number] = [48, 125, 232];  // #307de8
const DARK_GRAY:  [number, number, number] = [60, 60, 60];
const LIGHT_GRAY: [number, number, number] = [150, 150, 150];
const PURPLE:     [number, number, number] = [124, 58, 237];  // nível Extremo / Revitalize
const GREEN:      [number, number, number] = [22, 163, 74];
const ORANGE:     [number, number, number] = [234, 88, 12];

// ─── Cores por nível ──────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<string, [number, number, number]> = {
    essencial: GREEN,
    avancado:  ORANGE,
    extremo:   PURPLE,
};

// ─── Main export ──────────────────────────────────────────────────────────────
export const generateRevitalizePDF = async (
    clientName: string,
    clientPhone: string,
    pieces: RevitalizePiece[],
    laudoNumber?: string, // ex: pedido ID ou data
) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('pt-BR');
    const total = calcRevitalizeTotal(pieces);
    const totalStains = pieces.reduce((s, p) => s + p.stains.length, 0);
    const summary = summarizeByLevel(pieces);
    const docRef = laudoNumber ? `#${laudoNumber}` : date.replace(/\//g, '');

    // ── Cabeçalho ─────────────────────────────────────────────────────────────
    try {
        const logoImg = new Image();
        logoImg.src = '/logo-lave.png';
        await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = reject;
        });
        doc.addImage(logoImg, 'PNG', 15, 15, 25, 25);
    } catch {
        doc.setFillColor(...PRIMARY);
        doc.roundedRect(15, 15, 25, 25, 5, 5, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('LAVÊ', 27.5, 30, { align: 'center' });
    }

    // Nome da empresa
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY);
    doc.text('Lavê', 45, 27);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...LIGHT_GRAY);
    doc.text('Lavanderia Guaibim — Higienização profissional com qualidade e responsabilidade.', 45, 34);

    // Título do documento (direita)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PURPLE);
    doc.text('Laudo Revitalize+', 195, 22, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_GRAY);
    doc.text(`Ref: ${docRef}  •  Emissão: ${date}`, 195, 30, { align: 'right' });

    // ── Caixa de dados da empresa ─────────────────────────────────────────────
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(15, 45, 180, 25, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(...DARK_GRAY);

    doc.setFont('helvetica', 'bold');
    doc.text('CNPJ:', 20, 52);
    doc.setFont('helvetica', 'normal');
    doc.text('63.374.913/0001-98', 35, 52);

    doc.setFont('helvetica', 'bold');
    doc.text('Endereço:', 20, 58);
    doc.setFont('helvetica', 'normal');
    doc.text('Av. Aloísio Evangelista da Fonseca, Guaibim, Valença - BA', 42, 58);

    doc.setFont('helvetica', 'bold');
    doc.text('Contato:', 20, 64);
    doc.setFont('helvetica', 'normal');
    doc.text('(75) 98219-2177  •  @lave.guaibim', 40, 64);

    // ── Cards: Cliente + Aviso de cobrança ────────────────────────────────────
    const cardY = 78;

    // Card cliente
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, cardY, 110, 28, 3, 3, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...LIGHT_GRAY);
    doc.text('CLIENTE', 20, cardY + 7);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_GRAY);
    doc.text(clientName, 20, cardY + 16);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tel: ${clientPhone || '—'}`, 20, cardY + 22);

    // Card aviso
    doc.setFillColor(248, 245, 255);
    doc.setDrawColor(200, 180, 240);
    doc.roundedRect(133, cardY, 62, 28, 3, 3, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PURPLE);
    doc.text('POLÍTICA DE COBRANÇA', 137, cardY + 7);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_GRAY);
    doc.text('Manchas ≤ 20cm = 1 cobrança', 137, cardY + 14);
    doc.text('Manchas > 20cm = 2 cobranças', 137, cardY + 19);
    doc.text('Só cobrado se houver remoção.', 137, cardY + 24);

    // ── Tabela de preços por nível ────────────────────────────────────────────
    let currentY = cardY + 36;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_GRAY);
    doc.text('TABELA DE NÍVEIS', 15, currentY);
    currentY += 3;

    autoTable(doc, {
        startY: currentY,
        head: [['Nível', 'Para quem é', 'Exemplos', 'Preço/cobrança']],
        body: [
            ['Essencial', 'Manchas recentes, fáceis', 'Respingo, suor, poeira, sujeira leve', 'R$ 4,90'],
            ['Avançado', 'Média dificuldade', 'Maquiagem, protetor solar, vinho, mofo inicial', 'R$ 9,90'],
            ['Extremo', 'Difíceis / substância agressiva', 'Mofo avançado, ferrugem, sangue seco', 'R$ 24,90'],
        ],
        theme: 'plain',
        headStyles: {
            fillColor: [245, 247, 250],
            textColor: DARK_GRAY,
            fontSize: 8,
            fontStyle: 'bold',
        },
        bodyStyles: { fontSize: 8, textColor: DARK_GRAY },
        columnStyles: {
            0: { cellWidth: 25, fontStyle: 'bold' },
            1: { cellWidth: 42 },
            2: { cellWidth: 75 },
            3: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 0) {
                const levelName = data.cell.text[0].toLowerCase();
                if (levelName === 'essencial') data.cell.styles.textColor = GREEN;
                if (levelName === 'avançado')  data.cell.styles.textColor = ORANGE;
                if (levelName === 'extremo')   data.cell.styles.textColor = PURPLE;
            }
        },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // ── Seção: detalhamento por peça ──────────────────────────────────────────
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_GRAY);
    doc.text('DETALHAMENTO DAS PEÇAS', 15, currentY);
    currentY += 3;

    const tableRows: any[] = [];
    pieces.forEach((piece, pi) => {
        // Separador de peça
        tableRows.push([
            {
                content: `${pi + 1}. ${piece.name}`,
                colSpan: 5,
                styles: {
                    fillColor: [240, 240, 248],
                    fontStyle: 'bold',
                    fontSize: 8.5,
                    textColor: DARK_GRAY,
                },
            },
        ]);

        if (piece.stains.length === 0) {
            tableRows.push([
                { content: '   Nenhuma mancha registrada', colSpan: 5, styles: { textColor: LIGHT_GRAY, fontSize: 8 } }
            ]);
        } else {
            piece.stains.forEach((stain, si) => {
                const level = REVITALIZE_LEVELS[stain.level];
                const charges = stainCharges(stain);
                const value = stainValue(stain);
                tableRows.push([
                    `  ${si + 1}`,
                    level.label,
                    stain.size === 'grande' ? '> 20cm' : '≤ 20cm',
                    `${charges}x (R$ ${level.price.toFixed(2)})`,
                    stain.description || '—',
                    `R$ ${value.toFixed(2)}`,
                ]);
            });
        }
    });

    autoTable(doc, {
        startY: currentY,
        head: [['#', 'Nível', 'Tamanho', 'Cobranças', 'Descrição', 'Valor']],
        body: tableRows,
        theme: 'plain',
        headStyles: {
            fillColor: [245, 247, 250],
            textColor: DARK_GRAY,
            fontSize: 8,
            fontStyle: 'bold',
        },
        bodyStyles: { fontSize: 8, cellPadding: 2, textColor: DARK_GRAY },
        columnStyles: {
            0: { cellWidth: 8,  halign: 'center' },
            1: { cellWidth: 28, fontStyle: 'bold' },
            2: { cellWidth: 22, halign: 'center' },
            3: { cellWidth: 32, halign: 'center' },
            4: { cellWidth: 62 },
            5: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 1) {
                const txt = data.cell.text[0].toLowerCase();
                if (txt === 'essencial') data.cell.styles.textColor = GREEN;
                if (txt === 'avançado')  data.cell.styles.textColor = ORANGE;
                if (txt === 'extremo')   data.cell.styles.textColor = PURPLE;
            }
        },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // ── Resumo financeiro ─────────────────────────────────────────────────────
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 249, 250);
    const summaryHeight = 12 + summary.length * 7;
    doc.roundedRect(120, currentY, 75, summaryHeight, 3, 3, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...LIGHT_GRAY);
    doc.text('RESUMO DO ORÇAMENTO', 125, currentY + 7);

    let sy = currentY + 14;
    summary.forEach(s => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK_GRAY);
        doc.text(`${s.label} (${s.charges}x)`, 125, sy);
        doc.setFont('helvetica', 'bold');
        doc.text(`R$ ${s.subtotal.toFixed(2)}`, 192, sy, { align: 'right' });
        sy += 7;
    });

    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(125, sy - 2, 192, sy - 2);

    sy += 3;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_GRAY);
    doc.text('Total do Orçamento', 125, sy + 5);
    doc.setTextColor(...PRIMARY);
    doc.text(`R$ ${total.toFixed(2)}`, 192, sy + 5, { align: 'right' });

    // Resumo de peças e manchas (esquerda)
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_GRAY);
    doc.text(`Peças analisadas: ${pieces.length}`, 15, currentY + 10);
    doc.text(`Manchas identificadas: ${totalStains}`, 15, currentY + 17);

    currentY = currentY + summaryHeight + 15;

    // ── Aviso importante (caixa amarela) ─────────────────────────────────────
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(15, currentY, 180, 18, 3, 3, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 120, 0);
    doc.text('⚠  AVISO IMPORTANTE:', 20, currentY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_GRAY);
    const avisoText = 'Nem toda mancha pode ser removida completamente. Tecidos com desgaste severo, manchas permanentes ou substâncias';
    const avisoText2 = 'irreversíveis possuem limitações técnicas. Cobramos apenas pelo resultado visível entregue.';
    doc.text(avisoText, 20, currentY + 13);
    doc.text(avisoText2, 20, currentY + 18);

    currentY += 25;

    // ── Aceite do cliente ─────────────────────────────────────────────────────
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_GRAY);
    doc.text('( ) Aprovado integralmente     ( ) Aprovado parcialmente (especificar no verso)     ( ) Recusado', 15, currentY);

    currentY += 8;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, currentY, 120, currentY);
    doc.setFontSize(7.5);
    doc.setTextColor(...LIGHT_GRAY);
    doc.text('Assinatura e data do cliente', 15, currentY + 4);

    // ── Rodapé ────────────────────────────────────────────────────────────────
    const footerY = 274;
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(15, footerY, 195, footerY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY);
    doc.text('Obrigado pela confiança!', 105, footerY + 6, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...LIGHT_GRAY);
    doc.text('Higienização profissional · Qualidade · Responsabilidade · Fragrância exclusiva', 105, footerY + 11, { align: 'center' });
    doc.text('Lavê Lavanderia Guaibim — Cuidar bem é a nossa essência.', 105, footerY + 16, { align: 'center' });

    // ── Download ──────────────────────────────────────────────────────────────
    const safeName = clientName.replace(/[^a-zA-Z0-9À-ÿ\s]/g, '').trim();
    doc.save(`Lavê - Laudo Revitalize+ - ${safeName} - ${date.replace(/\//g, '-')}.pdf`);
};
