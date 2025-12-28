import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';

export const generateOrderPDF = async (order: Order) => {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [48, 125, 232]; // #307de8
    const darkGray: [number, number, number] = [60, 60, 60];
    const lightGray: [number, number, number] = [150, 150, 150];

    // Load and add logo
    try {
        const logoImg = new Image();
        logoImg.src = '/logo-lave.png';
        await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = reject;
        });
        
        // Add logo image (reduced size for better harmony)
        doc.addImage(logoImg, 'PNG', 15, 15, 25, 25);
    } catch (error) {
        // Fallback to colored rectangle if logo fails to load
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.roundedRect(15, 15, 25, 25, 5, 5, 'F');
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("LAVÊ", 27.5, 30, { align: "center" });
    }

    // Company Name - Lavê (moved closer to logo)
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Lavê", 45, 27);
    
    // Slogan (adjusted position)
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text("Cuidar bem é a nossa essência.", 45, 34);

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
    doc.text("63.374.913/0001-98", 35, 62);
    
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
    
    // Calculate client card height based on available info
    let clientCardHeight = 25;
    if (order.client.email) clientCardHeight += 5;
    if (order.client.document) clientCardHeight += 5;
    
    // Client Card
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, cardY, 85, clientCardHeight, 3, 3, 'FD');
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text("CLIENTE", 20, cardY + 6);
    
    let yOffset = cardY + 14;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(order.client.name, 20, yOffset);
    
    yOffset += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    // Always attempt to print phone, sometimes it might be missing from object but user says it's registered.
    // We'll print what we have or a placeholder if needed, but 'order.client.phone' is required in interface.
    doc.text(`Tel: ${order.client.phone || ''}`, 20, yOffset);
    
    if (order.client.email) {
        yOffset += 5;
        doc.text(`Email: ${order.client.email}`, 20, yOffset);
    }
    
    // Force document print if available

    
    if (order.client.document) {
        yOffset += 5;
        const docLabel = order.client.type === 'Pessoa Jurídica' ? 'CNPJ' : 'CPF';
        doc.text(`${docLabel}: ${order.client.document}`, 20, yOffset);
    }

    // Date Card
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(110, cardY, 85, 25, 3, 3, 'FD');
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text("DATAS", 115, cardY + 6);
    
    // Parse Dates
    // Creation Date (Prioritize "Data do Pedido" from details, else timestamp, else today)
    let creationDate = new Date();
    
    const orderDateMatch = order.details.match(/Data do Pedido: (\d{2}\/\d{2}\/\d{4})/);
    if (orderDateMatch) {
        // Parse dd/mm/yyyy
        const [day, month, year] = orderDateMatch[1].split('/').map(Number);
        creationDate = new Date(year, month - 1, day);
    } else if (order.timestamp) {
        const parsedDate = new Date(order.timestamp);
        if (!isNaN(parsedDate.getTime())) {
            creationDate = parsedDate;
        }
    }
    
    // Delivery Date Parsing from details
    let deliveryText = "A combinar";
    const deliveryMatch = order.details.match(/Previsão: (\d{2}\/\d{2}\/\d{4})/);
    if (deliveryMatch) {
         deliveryText = deliveryMatch[1];
    }
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(`Emissão: ${creationDate.toLocaleDateString('pt-BR')}`, 115, cardY + 14);
    doc.text(`Previsão: ${deliveryText}`, 115, cardY + 20);

    // Prepare Service Logic
    const hasUnderwearTax = order.details.includes('Taxa Roupa Íntima: R$ 20,00');
    
    // Calculate Base Value logic...
    let extrasTotal = 0;
    if (order.extras) {
        extrasTotal = order.extras.reduce((acc, extra) => acc + extra.price, 0);
    }
    
    const discountVal = order.discount || 0;
    const grossTotal = (order.value || 0) + discountVal;
    const derivedBaseValue = grossTotal - extrasTotal - (hasUnderwearTax ? 20 : 0);

    // Clean Details
    // Remove tags from details string
    let cleanDetails = order.details
        .replace(/Taxa Roupa Íntima: R\$ 20,00\.? ?/g, '')
        .replace(/Previsão: \d{2}\/\d{2}\/\d{4}\.? ?/g, '')
        .replace(/Data do Pedido: \d{2}\/\d{2}\/\d{4}\.? ?/g, '')
        .replace(/Extras: [^.]+\.? ?/g, '')
        .trim();
        
    // Format details with bullets
    const detailItems = cleanDetails.split(/\.\s+/).filter(Boolean);
    const formattedDetails = detailItems.map(item => `- ${item}`).join('\n');

    // Services Table
    const tableBody: any[] = [
        [
            { content: order.service + (formattedDetails ? `\n${formattedDetails}` : ''), styles: { fontStyle: 'bold' } },
            '1',
            `R$ ${derivedBaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            `R$ ${derivedBaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]
    ];
    
    // Add Tax Row if exists
    if (hasUnderwearTax) {
        tableBody.push([
            'Taxa Roupa Íntima',
            '1',
            'R$ 20,00',
            'R$ 20,00'
        ]);
    }

    // Add Extras to table if any
    if (order.extras && order.extras.length > 0) {
        order.extras.forEach(extra => {
            tableBody.push([
                `Extra: ${extra.name}`,
                '1',
                `R$ ${extra.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                `R$ ${extra.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
            cellPadding: 3, // Reduced padding for tighter spacing
            textColor: [60, 60, 60]
        },
        columnStyles: {
            0: { cellWidth: 95, fontStyle: 'normal' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 35, halign: 'right' },
            3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
        },
        // ...
    });

    // Payment Summary Box
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    const summaryY = finalY + 10;
    
    // ... calculations ...
    let subtotal = order.value || 0;
    if (order.extras && order.extras.length > 0) {
        subtotal += order.extras.reduce((acc, extra) => acc + extra.price, 0);
    }
    const discount = order.discount || 0;
    const total = Math.max(0, subtotal - discount);
    
    // ... drawing ...
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(120, summaryY, 75, 30, 3, 3, 'FD');
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text("Subtotal", 125, summaryY + 8);
    doc.text(`R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 190, summaryY + 8, { align: "right" });
    
    doc.text("Descontos", 125, summaryY + 14);
    doc.text(`R$ ${discount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 190, summaryY + 14, { align: "right" });
    
    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1);
    doc.line(125, summaryY + 17, 190, summaryY + 17);
    
    // Total
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text("Valor Total", 125, summaryY + 25); // Changed text
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 190, summaryY + 25, { align: "right" });

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
    
    doc.setFont("helvetica", "normal");
    doc.text("Lavê. Cuidar bem é a nossa essência.", 105, footerY + 18, { align: "center" });

    // Save with formatted filename: Lavê - Pedido 0004 - Ivan Andrade
    const formattedId = order.id.toString().padStart(4, '0');
    doc.save(`Lavê - Pedido ${formattedId} - ${order.client.name}.pdf`);
};
