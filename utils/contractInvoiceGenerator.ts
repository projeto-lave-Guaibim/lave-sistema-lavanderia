import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';
import { CONTRACT_TIERS, BASE_RATE, calculateCredit } from './contractUtils';

// ─── Cores ────────────────────────────────────────────────────────────────────
const PRIMARY:    [number, number, number] = [48, 125, 232];
const DARK_GRAY:  [number, number, number] = [60, 60, 60];
const LIGHT_GRAY: [number, number, number] = [150, 150, 150];
const GREEN:      [number, number, number] = [22, 163, 74];
const BG_LIGHT:   [number, number, number] = [248, 249, 250];
const BG_BLUE:    [number, number, number] = [237, 244, 255];

// ─── Helper: extrai kg do campo details ───────────────────────────────────────
const extractKg = (details: string): number => {
    const newFmt = details.match(/Contrato\s*\|\s*([\d.,]+)\s*kg/i);
    if (newFmt) return parseFloat(newFmt[1].replace(',', '.'));
    const oldFmt = details.match(/Peso:\s*([\d.,]+)\s*kg/i);
    if (oldFmt) return parseFloat(oldFmt[1].replace(',', '.'));
    return 0;
};

// ─── Helper: extrai categoria dos detalhes ────────────────────────────────────
const extractCategory = (details: string): string => {
    const match = details.match(/\(([^)]+)\)/);
    return match ? match[1] : 'Geral';
};

// ─── Cabeçalho ────────────────────────────────────────────────────────────────
const drawHeader = async (doc: jsPDF): Promise<number> => {
    let y = 12;
    try {
        const logoImg = new Image();
        logoImg.src = '/logo-lave.png';
        await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = reject;
        });
        doc.addImage(logoImg, 'PNG', 14, y, 22, 22);
    } catch {
        // Sem logo — continua
    }

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY);
    doc.text('Lav\u00ea', 40, y + 10);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...LIGHT_GRAY);
    doc.text('Cuidar bem \u00e9 a nossa ess\u00eancia.', 40, y + 16);

    return y + 28;
};

// ─── Interface ────────────────────────────────────────────────────────────────
interface ContractInvoiceData {
    clientName: string;
    month: number;
    year: number;
    orders: Order[];
    totalKg: number;
    alreadyCharged: number;
    rate: number;
    shouldCharge: number;
    credit: number;
    tierLabel: string;
}

// ─── Gerar PDF ────────────────────────────────────────────────────────────────
export const generateContractInvoice = async (data: ContractInvoiceData): Promise<void> => {
    const MONTH_NAMES = ['Janeiro','Fevereiro','Mar\u00e7o','Abril','Maio','Junho',
                         'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const marginL = 14;
    const marginR = 14;
    const contentW = pageW - marginL - marginR;

    let y = await drawHeader(doc);

    // ─── Título ───────────────────────────────────────────────────────────────
    doc.setFillColor(...PRIMARY);
    doc.roundedRect(marginL, y, contentW, 10, 1.5, 1.5, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('FATURA MENSAL \u2014 CONTRATO DE LAVANDERIA', pageW / 2, y + 6.5, { align: 'center' });
    y += 14;

    // ─── Info do cliente ──────────────────────────────────────────────────────
    doc.setFillColor(...BG_LIGHT);
    doc.roundedRect(marginL, y, contentW, 16, 1.5, 1.5, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_GRAY);
    doc.text('CLIENTE:', marginL + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(data.clientName, marginL + 24, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.text('PER\u00cdODO:', marginL + 4, y + 10.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${MONTH_NAMES[data.month - 1]} / ${data.year}`, marginL + 24, y + 10.5);

    const emitDate = new Date().toLocaleDateString('pt-BR');
    doc.setFont('helvetica', 'bold');
    doc.text('EMISS\u00c3O:', pageW / 2 + 10, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(emitDate, pageW / 2 + 30, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.text('FAIXA:', pageW / 2 + 10, y + 10.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PRIMARY);
    doc.text(data.tierLabel, pageW / 2 + 24, y + 10.5);
    y += 20;

    // ─── Tabela de faixas ─────────────────────────────────────────────────────
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...LIGHT_GRAY);
    doc.text('TABELA DE FAIXAS DE CONTRATO', marginL, y + 3);
    y += 5;

    autoTable(doc, {
        startY: y,
        head: [['Faixa', 'Limite', 'Valor por kg']],
        body: CONTRACT_TIERS.map(tier => {
            const match = tier.label.match(/\(([^)]+)\)/);
            const limitStr = match ? match[1] : `${tier.minKg} kg+`;
            return [
                tier.label.split('(')[0].trim(),
                limitStr,
                `R$ ${tier.price.toFixed(2)}`
            ];
        }),
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2, font: 'helvetica' },
        headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 40 },
            2: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
        },
        margin: { left: marginL, right: marginR },
    });
    y = (doc as any).lastAutoTable.finalY + 3;

    doc.setFillColor(...BG_BLUE);
    doc.roundedRect(marginL, y, contentW, 7, 1, 1, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PRIMARY);
    doc.text(
        `Taxa base cobrada no ato de cada pedido: R$ ${BASE_RATE.toFixed(2)}/kg. A diferen\u00e7a para a faixa real \u00e9 calculada ao final do m\u00eas.`,
        marginL + 3, y + 4.5
    );
    y += 11;

    // ─── Detalhamento de pedidos ──────────────────────────────────────────────
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...LIGHT_GRAY);
    doc.text(`MOVIMENTA\u00c7\u00d5ES DO M\u00caS (${data.orders.length} pedido${data.orders.length !== 1 ? 's' : ''})`, marginL, y + 3);
    y += 5;

    const orderRows = data.orders.map((order, idx) => {
        const kg = extractKg(order.details);
        const category = extractCategory(order.details);
        let dateStr = '\u2014';
        try {
            const d = new Date(order.timestamp);
            if (!isNaN(d.getTime())) dateStr = d.toLocaleDateString('pt-BR');
        } catch {}

        return [
            String(idx + 1),
            dateStr,
            category,
            kg > 0 ? `${kg.toFixed(2)} kg` : '\u2014',
            `R$ ${BASE_RATE.toFixed(2)}`,
            `R$ ${(order.value || 0).toFixed(2)}`
        ];
    });

    autoTable(doc, {
        startY: y,
        head: [['#', 'Data', 'Categoria', 'Peso', 'Taxa/kg', 'Valor']],
        body: orderRows,
        theme: 'striped',
        styles: { fontSize: 7, cellPadding: 2, font: 'helvetica' },
        headStyles: { fillColor: DARK_GRAY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 25 },
            2: { cellWidth: 45 },
            3: { cellWidth: 25, halign: 'right' },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: marginL, right: marginR },
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    // ─── Resumo financeiro ────────────────────────────────────────────────────
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...LIGHT_GRAY);
    doc.text('RESUMO FINANCEIRO', marginL, y + 3);
    y += 6;

    const boxH = 36;
    doc.setFillColor(...BG_LIGHT);
    doc.roundedRect(marginL, y, contentW, boxH, 1.5, 1.5, 'F');

    const drawLine = (label: string, value: string, lineY: number, bold = false, color: [number, number, number] = DARK_GRAY) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setTextColor(...DARK_GRAY);
        doc.text(label, marginL + 5, lineY);
        doc.setTextColor(...color);
        doc.setFont('helvetica', 'bold');
        doc.text(value, pageW - marginR - 5, lineY, { align: 'right' });
    };

    drawLine('Total de kg no m\u00eas', `${data.totalKg.toFixed(2)} kg`, y + 6);
    drawLine(`J\u00e1 cobrado (${data.orders.length} pedidos x R$ ${BASE_RATE.toFixed(2)}/kg)`, `R$ ${data.alreadyCharged.toFixed(2)}`, y + 12);
    drawLine(`Valor correto pela faixa (R$ ${data.rate.toFixed(2)}/kg)`, `R$ ${data.shouldCharge.toFixed(2)}`, y + 18);

    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(marginL + 5, y + 22, pageW - marginR - 5, y + 22);

    if (data.credit > 0) {
        drawLine('CR\u00c9DITO PARA PR\u00d3XIMO M\u00caS', `R$ ${data.credit.toFixed(2)}`, y + 28, true, GREEN);
    } else if (data.credit < 0) {
        drawLine('VALOR ADICIONAL A COBRAR', `R$ ${Math.abs(data.credit).toFixed(2)}`, y + 28, true, [220, 38, 38]);
    } else {
        drawLine('SALDO', 'R$ 0,00 (sem diferen\u00e7a)', y + 28, true, LIGHT_GRAY);
    }
    y += boxH + 6;

    // ─── Mensagem explicativa ─────────────────────────────────────────────────
    if (data.credit > 0) {
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(marginL, y, contentW, 18, 1.5, 1.5, 'F');
        doc.setDrawColor(...GREEN);
        doc.setLineWidth(0.4);
        doc.roundedRect(marginL, y, contentW, 18, 1.5, 1.5, 'S');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GREEN);
        doc.text('Voc\u00ea tem cr\u00e9dito!', marginL + 5, y + 5.5);

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK_GRAY);
        const creditMsg = `Durante o m\u00eas de ${MONTH_NAMES[data.month - 1]}/${data.year}, voc\u00ea utilizou ${data.totalKg.toFixed(2)} kg, `
            + `atingindo a ${data.tierLabel} com taxa de R$ ${data.rate.toFixed(2)}/kg. `
            + `Como os pedidos foram cobrados a R$ ${BASE_RATE.toFixed(2)}/kg (taxa base), `
            + `voc\u00ea possui um cr\u00e9dito de R$ ${data.credit.toFixed(2)} que ser\u00e1 aplicado no pr\u00f3ximo m\u00eas.`;
        const lines = doc.splitTextToSize(creditMsg, contentW - 10);
        doc.text(lines, marginL + 5, y + 10);
        y += 22;
    } else {
        doc.setFillColor(...BG_BLUE);
        doc.roundedRect(marginL, y, contentW, 14, 1.5, 1.5, 'F');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK_GRAY);
        const infoMsg = `No m\u00eas de ${MONTH_NAMES[data.month - 1]}/${data.year}, voc\u00ea utilizou ${data.totalKg.toFixed(2)} kg, `
            + `enquadrando-se na ${data.tierLabel} (R$ ${data.rate.toFixed(2)}/kg). N\u00e3o h\u00e1 cr\u00e9dito a compensar.`;
        const lines = doc.splitTextToSize(infoMsg, contentW - 10);
        doc.text(lines, marginL + 5, y + 6);
        y += 18;
    }

    // ─── Rodapé ───────────────────────────────────────────────────────────────
    y += 6;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(marginL, y, pageW - marginR, y);
    y += 5;

    doc.setFontSize(6);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...LIGHT_GRAY);
    doc.text('Documento gerado automaticamente pelo sistema Lav\u00ea.', pageW / 2, y, { align: 'center' });
    doc.text(`Emitido em ${emitDate}`, pageW / 2, y + 4, { align: 'center' });

    // ─── Salvar PDF ───────────────────────────────────────────────────────────
    const fileName = `Fatura_Contrato_${data.clientName.replace(/\s+/g, '_')}_${MONTH_NAMES[data.month - 1]}_${data.year}.pdf`;
    doc.save(fileName);
};
