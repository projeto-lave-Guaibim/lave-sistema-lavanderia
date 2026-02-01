import { Order } from '../types';

export const generateOrdersCSV = (orders: Order[]) => {
    // Configuração das colunas (CSV usa ; para abrir no Excel Brasil automaticamente)
    const header = [
        "ID Pedido",
        "Data",
        "Cliente",
        "CPF/CNPJ",
        "Serviço (Resumo)",
        "Detalhamento do Serviço", // Nova coluna detalhada
        "Observações",
        "Valor (R$)",
        "Status",
        "Documento"
    ].join(";");

    const rows = orders.map(order => {
        const date = new Date(order.timestamp || Date.now()).toLocaleDateString('pt-BR');
        const doc = order.client.document ? order.client.document.replace(/\D/g, '') : "Não Informado";
        
        // Sanitizar strings para evitar quebras no CSV
        const cleanName = order.client.name.replace(/;/g, ',');
        const cleanService = order.service.replace(/;/g, ',');
        const cleanDetails = (order.details || "").replace(/;/g, ',').replace(/\n/g, ' ');

        // Formatar itens do pedido (Ex: "Cortina (2x) | Edredom (1x)")
        let detailedItems = "";
        if (order.orderItems && order.orderItems.length > 0) {
            detailedItems = order.orderItems.map(item => `${item.service_name} (${item.quantity}x)`).join(" | ");
        } else {
            // Fallback para descrição antiga se não tiver itens detalhados
            detailedItems = cleanDetails; 
        }
        detailedItems = detailedItems.replace(/;/g, ','); // Sanitizar

        return [
            order.id,
            date,
            cleanName,
            doc,
            cleanService,
            detailedItems,
            cleanDetails, // Coluna Observações separada
            order.value.toFixed(2).replace('.', ','),
            order.status,
            doc.length >= 11 ? "NFS-e (RPS)" : "Ordem de Serviço"
        ].join(";");
    });

    return [header, ...rows].join("\n");
};

export const downloadCSV = (content: string, fileName: string) => {
    // BOM para o Excel reconhecer acentos (UTF-8)
    const BOM = "\uFEFF"; 
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
