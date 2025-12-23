import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';

export const generateOrderPDF = (order: Order) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("Lavê - Lavanderia Guaibim", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("CNPJ: 12.345.678/0001-99", 105, 26, { align: "center" });
    doc.text("Rua das Flores, 123 - Guaibim, Valença - BA", 105, 31, { align: "center" });
    doc.text("(75) 99999-9999", 105, 36, { align: "center" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 42, 190, 42);

    // Order Info
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Comprovante de Pedido #${order.id}`, 20, 55);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const today = new Date();
    doc.text(`Data de Emissão: ${today.toLocaleDateString('pt-BR')}`, 20, 62);
    doc.text(`Previsão de Entrega: ${new Date(today.setDate(today.getDate() + 2)).toLocaleDateString('pt-BR')}`, 20, 67);

    // Client Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Dados do Cliente", 130, 55);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(order.client.name, 130, 62);
    doc.text(order.client.phone, 130, 67);

    // Table
    const tableBody = [
        [order.service, order.details, `R$ ${order.value?.toFixed(2).replace('.', ',')}`]
    ];

    // Add Extras to table if any
    if (order.extras && order.extras.length > 0) {
        order.extras.forEach(extra => {
            tableBody.push([
                `Extra: ${extra.name}`,
                '-',
                `R$ ${extra.price.toFixed(2).replace('.', ',')}`
            ]);
        });
    }

    autoTable(doc, {
        startY: 80,
        head: [['Descrição', 'Detalhes', 'Valor']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 70 },
            2: { cellWidth: 30, halign: 'right' }
        }
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 80;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total a Pagar: R$ ${order.value?.toFixed(2).replace('.', ',')}`, 190, finalY + 15, { align: "right" });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Obrigado pela preferência!", 105, 280, { align: "center" });
    doc.text("Lavê Lavanderia - Cuidando do que é seu.", 105, 285, { align: "center" });

    // Save
    doc.save(`pedido_${order.id}_${order.client.name.replace(/\s+/g, '_')}.pdf`);
};
