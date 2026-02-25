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

// ─── Cores ────────────────────────────────────────────────────────────────────
const PRIMARY:    [number, number, number] = [48, 125, 232];
const DARK_GRAY:  [number, number, number] = [60, 60, 60];
const LIGHT_GRAY: [number, number, number] = [150, 150, 150];
const PURPLE:     [number, number, number] = [124, 58, 237];
const GREEN:      [number, number, number] = [22, 163, 74];
const ORANGE:     [number, number, number] = [234, 88, 12];
const BG_GRAY:    [number, number, number] = [248, 249, 250];
const BG_PURPLE:  [number, number, number] = [248, 245, 255];

// ─── Cabeçalho ────────────────────────────────────────────────────────────────
const drawHeader = async (doc: jsPDF, date: string, docRef: string): Promise<number> => {
    try {
        const logoImg = new Image();
        logoImg.src = '/logo-lave.png';
        await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = reject;
        });
        doc.addImage(logoImg, 'PNG', 15, 12, 22, 22);
    } catch {
        doc.setFillColor(...PRIMARY);
        doc.roundedRect(15, 12, 22, 22, 4, 4, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('LAVE', 26, 25, { align: 'center' });
    }

    // Nome da empresa
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY);
    doc.text('Lave', 42, 21);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...LIGHT_GRAY);
    doc.text('Lavanderia Guaibim', 42, 27);
    doc.text('Higienização profissional com qualidade e responsabilidade.', 42, 31);

    // Título direita
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PURPLE);
    doc.text('Laudo Revitalize+', 195, 18, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_GRAY);
    doc.text(`Ref: ${docRef}`, 195, 25, { align: 'right' });
    doc.text(`Emissão: ${date}`, 195, 30, { align: 'right' });

    // Linha divisória
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(15, 38, 195, 38);

    return 42;
};

// ─── Rodapé ───────────────────────────────────────────────────────────────────
const drawFooter = (doc: jsPDF, currentY: number) => {
    const pageH = doc.internal.pageSize.height;
    let y = currentY + 10;

    // Caixa de aviso
    const avisoH = 26;
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(15, y, 180, avisoH, 3, 3, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(160, 100, 0);
    doc.text('AVISO IMPORTANTE:', 19, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_GRAY);
    doc.text('Nem toda mancha pode ser removida completamente. Tecidos com desgaste severo, manchas', 19, y + 13);
    doc.text('permanentes ou subst\u00e2ncias irrevers\u00edveis possuem limita\u00e7\u00f5es t\u00e9cnicas.', 19, y + 18);
    doc.text('Cobramos apenas pelo resultado vis\u00edvel entregue ao cliente.', 19, y + 23);

    y += avisoH + 10;

    // Linha de aceite
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_GRAY);
    doc.text(
        '( ) Aprovado integralmente     ( ) Aprovado parcialmente (especificar)     ( ) Recusado',
        15, y
    );

    y += 9;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(15, y, 110, y);
    doc.setFontSize(7.5);
    doc.setTextColor(...LIGHT_GRAY);
    doc.text('Assinatura e data do cliente', 15, y + 5);

    // Rodapé da página (só se tiver espaço suficiente)
    const footerY = pageH - 18;
    if (y + 14 < footerY) {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.4);
        doc.line(15, footerY, 195, footerY);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PRIMARY);
        doc.text('Obrigado pela confiança!', 105, footerY + 6, { align: 'center' });

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...LIGHT_GRAY);
        doc.text(
            'Higienização profissional - Qualidade - Responsabilidade - Fragrância exclusiva',
            105, footerY + 11, { align: 'center' }
        );
        doc.text(
            'Lavê Lavanderia Guaibim - Cuidar bem é a nossa essência.',
            105, footerY + 16, { align: 'center' }
        );
    }
};

// ─── Exportação principal ─────────────────────────────────────────────────────
export const generateRevitalizePDF = async (
    clientName: string,
    clientPhone: string,
    pieces: RevitalizePiece[],
    laudoNumber?: string,
) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('pt-BR');
    const docRef = laudoNumber || date.replace(/\//g, '');
    const total = calcRevitalizeTotal(pieces);
    const totalStains = pieces.reduce((s, p) => s + p.stains.length, 0);
    const summary = summarizeByLevel(pieces);

    let y = await drawHeader(doc, date, docRef);

    // ── Dados da empresa ──────────────────────────────────────────────────────
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(...BG_GRAY);
    doc.roundedRect(15, y, 180, 20, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(...DARK_GRAY);

    doc.setFont('helvetica', 'bold');  doc.text('CNPJ:', 19, y + 6);
    doc.setFont('helvetica', 'normal'); doc.text('63.374.913/0001-98', 33, y + 6);

    doc.setFont('helvetica', 'bold');  doc.text('Endereço:', 19, y + 12);
    doc.setFont('helvetica', 'normal'); doc.text('Av. Aloísio Evangelista da Fonseca, Guaibim, Valença - BA', 41, y + 12);

    doc.setFont('helvetica', 'bold');  doc.text('Contato:', 19, y + 18);
    doc.setFont('helvetica', 'normal'); doc.text('(75) 98219-2177  -  @lave.guaibim', 38, y + 18);

    y += 26;

    // ── Cards lado a lado ─────────────────────────────────────────────────────
    // Card do cliente
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, y, 108, 24, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...LIGHT_GRAY);
    doc.text('CLIENTE', 19, y + 6);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_GRAY);
    doc.text(clientName, 19, y + 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tel: ${clientPhone || '-'}`, 19, y + 20);

    // Card política de cobrança
    doc.setFillColor(...BG_PURPLE);
    doc.setDrawColor(200, 180, 240);
    doc.roundedRect(129, y, 66, 24, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PURPLE);
    doc.text('POLÍTICA DE COBRANÇA', 133, y + 6);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_GRAY);
    doc.text('<= 20cm  =  1 cobrança', 133, y + 13);
    doc.text('>  20cm  =  2 cobranças', 133, y + 18);
    doc.text('Só cobra se houver remoção.', 133, y + 23);

    y += 30;

    // ── Tabela de níveis ──────────────────────────────────────────────────────
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_GRAY);
    doc.text('NÍVEIS DE TRATAMENTO', 15, y);
    y += 2;

    autoTable(doc, {
        startY: y,
        head: [['Nível', 'Exemplos de manchas', 'Preço/cobrança']],
        body: [
            ['Essencial', 'Respingo, suor, poeira, sujeira leve, café claro', 'R$ 4,90'],
            ['Avançado',  'Maquiagem, protetor solar, vinho, mofo inicial, óleo', 'R$ 9,90'],
            ['Extremo',   'Mofo avançado, ferrugem, sangue seco, protetor oxidado', 'R$ 24,90'],
        ],
        theme: 'plain',
        headStyles: { fillColor: [240, 242, 246], textColor: DARK_GRAY, fontSize: 7.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, cellPadding: 2.5, textColor: DARK_GRAY },
        columnStyles: {
            0: { cellWidth: 25, fontStyle: 'bold' },
            1: { cellWidth: 130 },
            2: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 0) {
                const txt = data.cell.text[0].toLowerCase();
                if (txt.includes('essencial')) data.cell.styles.textColor = GREEN;
                if (txt.includes('avan'))      data.cell.styles.textColor = ORANGE;
                if (txt.includes('extremo'))   data.cell.styles.textColor = PURPLE;
            }
        },
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Tabela resumo por peça ────────────────────────────────────────────────
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_GRAY);
    doc.text('RESUMO POR PEÇA', 15, y);
    y += 2;

    const totalChargesAll = pieces.reduce((s, p) =>
        s + p.stains.reduce((ss, st) => ss + stainCharges(st), 0), 0
    );

    const summaryRows: any[] = pieces.map((piece, idx) => {
        const ess = piece.stains.filter(s => s.level === 'essencial').length;
        const ava = piece.stains.filter(s => s.level === 'avancado').length;
        const ext = piece.stains.filter(s => s.level === 'extremo').length;
        const pieceCharges = piece.stains.reduce((s, st) => s + stainCharges(st), 0);
        const pieceTotal = piece.stains.reduce((s, st) => s + stainValue(st), 0);
        return [
            `${idx + 1}. ${piece.name}`,
            piece.stains.length.toString(),
            pieceCharges.toString(),
            ess > 0 ? ess.toString() : '-',
            ava > 0 ? ava.toString() : '-',
            ext > 0 ? ext.toString() : '-',
            `R$ ${pieceTotal.toFixed(2)}`,
        ];
    });

    // Linha de total
    summaryRows.push([
        { content: 'TOTAL GERAL', styles: { fontStyle: 'bold', fillColor: [245, 247, 250] } },
        { content: totalStains.toString(),      styles: { fontStyle: 'bold', fillColor: [245, 247, 250], halign: 'center' } },
        { content: totalChargesAll.toString(),  styles: { fontStyle: 'bold', fillColor: [245, 247, 250], halign: 'center' } },
        { content: (summary.find(s => s.key === 'essencial')?.count ?? 0) > 0 ? summary.find(s => s.key === 'essencial')!.count.toString() : '-', styles: { fontStyle: 'bold', fillColor: [245, 247, 250], halign: 'center', textColor: GREEN } },
        { content: (summary.find(s => s.key === 'avancado')?.count  ?? 0) > 0 ? summary.find(s => s.key === 'avancado')!.count.toString()  : '-', styles: { fontStyle: 'bold', fillColor: [245, 247, 250], halign: 'center', textColor: ORANGE } },
        { content: (summary.find(s => s.key === 'extremo')?.count   ?? 0) > 0 ? summary.find(s => s.key === 'extremo')!.count.toString()   : '-', styles: { fontStyle: 'bold', fillColor: [245, 247, 250], halign: 'center', textColor: PURPLE } },
        { content: `R$ ${total.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [245, 247, 250], halign: 'right', textColor: PRIMARY } },
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Peça', 'Manchas', 'Cobr.', 'Ess.', 'Avan.', 'Ext.', 'Total']],
        body: summaryRows,
        theme: 'plain',
        headStyles: { fillColor: [240, 242, 246], textColor: DARK_GRAY, fontSize: 7.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: DARK_GRAY },
        columnStyles: {
            0: { cellWidth: 65 },
            1: { cellWidth: 18, halign: 'center' },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 14, halign: 'center', textColor: GREEN },
            4: { cellWidth: 14, halign: 'center', textColor: ORANGE },
            5: { cellWidth: 14, halign: 'center', textColor: PURPLE },
            6: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
        },
    });

    y = (doc as any).lastAutoTable.finalY + 4;

    // ── Detalhamento completo ─────────────────────────────────────────────────
    const hasDetail = pieces.some(p => p.stains.length > 0);
    if (hasDetail) {
        if (pieces.length > 4) {
            doc.addPage();
            y = await drawHeader(doc, date, docRef);
            y += 4;
        }

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK_GRAY);
        doc.text('DETALHAMENTO DAS MANCHAS', 15, y);
        y += 2;

        const detailRows: any[] = [];
        pieces.forEach((piece, pi) => {
            detailRows.push([{
                content: `${pi + 1}.  ${piece.name}`,
                colSpan: 6,
                styles: {
                    fillColor: [237, 237, 247],
                    fontStyle: 'bold',
                    fontSize: 8,
                    textColor: DARK_GRAY,
                    cellPadding: { top: 3, bottom: 3, left: 5, right: 4 },
                },
            }]);

            if (piece.stains.length === 0) {
                detailRows.push([{
                    content: '     Nenhuma mancha registrada',
                    colSpan: 6,
                    styles: { textColor: LIGHT_GRAY, fontSize: 7.5, cellPadding: 2 },
                }]);
            } else {
                piece.stains.forEach((stain, si) => {
                    const level = REVITALIZE_LEVELS[stain.level];
                    const charges = stainCharges(stain);
                    const value = stainValue(stain);
                    const levelColor =
                        stain.level === 'essencial' ? GREEN :
                        stain.level === 'avancado'  ? ORANGE : PURPLE;
                    detailRows.push([
                        `  ${si + 1}`,
                        { content: level.label, styles: { textColor: levelColor, fontStyle: 'bold' } },
                        stain.size === 'grande' ? '> 20cm' : '<= 20cm',
                        `${charges}x  ( R$ ${level.price.toFixed(2)} )`,
                        stain.description || '-',
                        `R$ ${value.toFixed(2)}`,
                    ]);
                });
            }
        });

        autoTable(doc, {
            startY: y,
            head: [['#', 'Nível', 'Tamanho', 'Cobranças', 'Descrição', 'Valor']],
            body: detailRows,
            theme: 'plain',
            headStyles: { fillColor: [240, 242, 246], textColor: DARK_GRAY, fontSize: 7.5, fontStyle: 'bold' },
            bodyStyles: { fontSize: 7.5, cellPadding: 2, textColor: DARK_GRAY },
            columnStyles: {
                0: { cellWidth: 8,  halign: 'center' },
                1: { cellWidth: 25 },
                2: { cellWidth: 22, halign: 'center' },
                3: { cellWidth: 32, halign: 'center' },
                4: { cellWidth: 68 },
                5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
            },
        });

        y = (doc as any).lastAutoTable.finalY + 4;
    }

    drawFooter(doc, y);

    // Salvar
    const safeName = clientName.replace(/[<>:"/\\|?*]/g, '').trim();
    doc.save(`Lavê - Laudo Revitalize+ - ${safeName} - ${date.replace(/\//g, '-')}.pdf`);
};
