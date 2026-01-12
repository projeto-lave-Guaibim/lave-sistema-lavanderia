import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, TransactionType } from '../types';

export const generateFinanceReportPDF = (transactions: Transaction[], startDate: string, endDate: string) => {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [48, 125, 232]; // #307de8
    const darkGray: [number, number, number] = [60, 60, 60];

    // --- Header ---
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Relatório Financeiro", 15, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`, 15, 27);
    
    doc.setFontSize(8);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 15, 32);

    // Company Info (Right aligned)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("LAVÊ", 195, 20, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("CNPJ: 63.374.913/0001-98", 195, 25, { align: "right" });
    doc.text("Valença - BA", 195, 29, { align: "right" });

    let currentY = 40;

    // --- Summary Section ---
    const revenues = transactions.filter(t => t.type === TransactionType.Receita);
    const expenses = transactions.filter(t => t.type === TransactionType.Despesa);

    const totalRevenue = revenues.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const balance = totalRevenue - totalExpense;

    doc.setFillColor(248, 249, 250);
    doc.roundedRect(15, currentY, 180, 25, 3, 3, 'F');
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO DO PERÍODO", 20, currentY + 8);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    // Revenue
    doc.setTextColor(0, 100, 0); // Green
    doc.text("Total Receitas:", 20, currentY + 18);
    doc.text(`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 50, currentY + 18);

    // Expense
    doc.setTextColor(180, 0, 0); // Red
    doc.text("Total Despesas:", 80, currentY + 18);
    doc.text(`R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 110, currentY + 18);

    // Balance
    const balanceColor = balance >= 0 ? [0, 100, 0] : [180, 0, 0];
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2] as number); // Fix types
    doc.setFont("helvetica", "bold");
    doc.text("Saldo:", 140, currentY + 18);
    doc.text(`R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 190, currentY + 18, { align: 'right' });

    currentY += 35;

    // --- Content Tables ---
    
    const columns = ["Data", "Descrição", "Grupo/Categoria", "Valor"];

    // 1. Receitas
    if (revenues.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("Receitas", 15, currentY);
        currentY += 5;

        const revenueRows = revenues.map(t => [
            t.date,
            t.description,
            t.group ? `${t.group} - ${t.category}` : (t.category || '-'),
            `R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [columns],
            body: revenueRows,
            theme: 'striped',
            headStyles: { fillColor: [46, 204, 113] }, // Green
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 80 },
                2: { cellWidth: 50 },
                3: { cellWidth: 30, halign: 'right' }
            }
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // 2. Despesas
    if (expenses.length > 0) {
        // Check page break
        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("Despesas", 15, currentY);
        currentY += 5;

        const expenseRows = expenses.map(t => [
            t.date,
            t.description,
            t.group ? `${t.group} - ${t.category}` : (t.category || '-'),
            `R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [columns],
            body: expenseRows,
            theme: 'striped',
            headStyles: { fillColor: [231, 76, 60] }, // Red
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 80 },
                2: { cellWidth: 50 },
                3: { cellWidth: 30, halign: 'right' }
            }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Página ${i} de ${pageCount}`, 195, 290, { align: "right" });
    }

    doc.save(`Relatorio_Financeiro_${startDate}_${endDate}.pdf`);
};
