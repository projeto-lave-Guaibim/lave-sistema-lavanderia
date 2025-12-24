import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';

export const generateOrderPDF = (order: Order) => {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [48, 125, 232]; // #307de8
    const darkGray: [number, number, number] = [60, 60, 60];
    const lightGray: [number, number, number] = [150, 150, 150];

    // Header - Logo area with gradient effect (simulated with rectangle)
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(15, 15, 35, 35, 5, 5, 'F');
    
    // Logo icon placeholder (washing machine symbol)
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text("🧺", 32.5, 37, { align: "center" });

    // Company Name - Lavê
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Lavê", 55, 30);
    
    // Slogan
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text("Cuidar bem é a nossa essência.", 55, 37);

    // Comprovante title (right side)
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Comprovante", 195, 25, { align: "right" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(`Pedido #${order.id}`, 195, 32, { align: "right" });

    // Company Info Box
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(15, 55, 180, 22, 3, 3, 'FD');
    
    doc.setFontSize(9);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    
    // CNPJ
    doc.setFont("helvetica", "bold");
    doc.text("CNPJ:", 20, 62);
    doc.setFont("helvetica", "normal");
    doc.text("63.374.913/0009-8", 35, 62);
    
    // Address
    doc.setFont("helvetica", "bold");
    doc.text("Endereço:", 20, 68);
    doc.setFont("helvetica", "normal");
    doc.text("AV Aloisio Evangelista da Fonseca, Guaibim, Valença - BA", 40, 68);
    
    // Phone
    doc.setFont("helvetica", "bold");
    doc.text("Contato:", 20, 74);
    doc.setFont("helvetica", "normal");
    doc.text("(75) 98219-2177", 38, 74);

    // Client and Date Info Cards
    const cardY = 85;
    
    // Client Card
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, cardY, 85, 25, 3, 3, 'FD');
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text("CLIENTE", 20, cardY + 6);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(order.client.name, 20, cardY + 14);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(order.client.phone, 20, cardY + 20);

    // Date Card
    doc.roundedRect(110, cardY, 85, 25, 3, 3, 'FD');
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text("DATAS", 115, cardY + 6);
    
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(deliveryDate.getDate() + 2);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(`Emissão: ${today.toLocaleDateString('pt-BR')}`, 115, cardY + 14);
    doc.text(`Previsão: ${deliveryDate.toLocaleDateString('pt-BR')}`, 115, cardY + 20);

    // Services Table
    const tableBody: any[] = [
        [
            { content: order.service + (order.details ? `\n${order.details}` : ''), styles: { fontStyle: 'bold' } },
            '1',
            `R$ ${order.value?.toFixed(2).replace('.', ',')}`,
            `R$ ${order.value?.toFixed(2).replace('.', ',')}`
        ]
    ];

    // Add Extras to table if any
    if (order.extras && order.extras.length > 0) {
        order.extras.forEach(extra => {
            tableBody.push([
                `Extra: ${extra.name}`,
                '1',
                `R$ ${extra.price.toFixed(2).replace('.', ',')}`,
                `R$ ${extra.price.toFixed(2).replace('.', ',')}`
            ]);
        });
    }

    autoTable(doc, {
        startY: 120,
        head: [['Descrição do Serviço', 'Qtd.', 'Valor Unit.', 'Subtotal']],
        body: tableBody,
        theme: 'plain',
        headStyles: {
            fillColor: [245, 247, 250],
            textColor: [60, 60, 60],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'left'
        },
        styles: {
            fontSize: 9,
            cellPadding: 5,
            textColor: [60, 60, 60]
        },
        columnStyles: {
            0: { cellWidth: 95, fontStyle: 'normal' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 35, halign: 'right' },
            3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
        },
        alternateRowStyles: {
            fillColor: [252, 252, 253]
        },
        didDrawPage: function(data) {
            // Add border to table
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
        }
    });

    // Payment Summary Box
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    const summaryY = finalY + 10;
    
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(120, summaryY, 75, 30, 3, 3, 'FD');
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text("Subtotal", 125, summaryY + 8);
    doc.text(`R$ ${order.value?.toFixed(2).replace('.', ',')}`, 190, summaryY + 8, { align: "right" });
    
    doc.text("Descontos", 125, summaryY + 14);
    doc.text("R$ 0,00", 190, summaryY + 14, { align: "right" });
    
    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1);
    doc.line(125, summaryY + 17, 190, summaryY + 17);
    
    // Total
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text("Total a Pagar", 125, summaryY + 25);
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`R$ ${order.value?.toFixed(2).replace('.', ',')}`, 190, summaryY + 25, { align: "right" });

    // Footer
    const footerY = 270;
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(15, footerY, 195, footerY);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Obrigado pela sua preferência!", 105, footerY + 7, { align: "center" });
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text("Seu pedido será tratado com todo cuidado e carinho.", 105, footerY + 12, { align: "center" });
    
    doc.setFont("helvetica", "italic");
    doc.text("💙 Lavê. Cuidar bem é a nossa essência.", 105, footerY + 18, { align: "center" });

    // Save with formatted filename
    const clientName = order.client.name.replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    doc.save(`Lavê_Pedido_${order.id}_${clientName}.pdf`);
};
