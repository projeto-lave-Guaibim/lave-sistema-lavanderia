import { Order, Client } from '../types';

// CONFIGURAÇÃO DA EMPRESA (Preencha com dados reais)
const COMPANY_CONFIG = {
    CNPJ: "63374913000198", // Apenas números
    IM: "PREENCHER_IM",     // Inscrição Municipal (Obrigatório)
    COD_SERVICO: "14.05",   // Código do Serviço (Lei 116)
    ALIQUOTA: 0.05,         // 5% (Verificar sua alíquota Simples Nacional)
    ITEM_LISTA_SERVICO: "1405",
    COD_TRIBUTACAO_MUNICIPIO: "1405" // Verificar na prefeitura
};

export const generateRPSXML = (orders: Order[], batchNumber: number) => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">
    <LoteRps id="Lote${batchNumber}">
        <NumeroLote>${batchNumber}</NumeroLote>
        <Cnpj>${COMPANY_CONFIG.CNPJ}</Cnpj>
        <InscricaoMunicipal>${COMPANY_CONFIG.IM}</InscricaoMunicipal>
        <QuantidadeRps>${orders.length}</QuantidadeRps>
        <ListaRps>`;

    orders.forEach(order => {
        // Validação básica
        if (!order.client.document) return; // Pula se não tiver CPF/CNPJ

        const rpsNumber = order.id; // Usando ID do pedido como número do RPS (Provisório)
        const date = new Date(order.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
        const value = order.value || 0;
        const issValue = value * COMPANY_CONFIG.ALIQUOTA;

        // Limpa formatação CPF/CNPJ
        const cleanDoc = order.client.document.replace(/\D/g, '');
        const cleanZip = order.client.zipCode ? order.client.zipCode.replace(/\D/g, '') : '';

        // Formato ABRASF Simplificado
        xml += `
            <Rps>
                <InfDeclaracaoPrestacaoServico>
                    <Rps>
                        <IdentificacaoRps>
                            <Numero>${rpsNumber}</Numero>
                            <Serie>1</Serie>
                            <Tipo>1</Tipo>
                        </IdentificacaoRps>
                        <DataEmissao>${date}</DataEmissao>
                        <Status>1</Status>
                    </Rps>
                    <Competencia>${date}</Competencia>
                    <Servico>
                        <Valores>
                            <ValorServicos>${value.toFixed(2)}</ValorServicos>
                            <ValorIss>${issValue.toFixed(2)}</ValorIss>
                            <Aliquota>${COMPANY_CONFIG.ALIQUOTA}</Aliquota>
                        </Valores>
                        <IssRetido>2</IssRetido>
                        <ItemListaServico>${COMPANY_CONFIG.ITEM_LISTA_SERVICO}</ItemListaServico>
                        <CodigoTributacaoMunicipio>${COMPANY_CONFIG.COD_TRIBUTACAO_MUNICIPIO}</CodigoTributacaoMunicipio>
                        <Discriminacao>${order.service} - ${order.details.replace(/[<>]/g, '')}</Discriminacao>
                        <CodigoMunicipio>2932603</CodigoMunicipio>
                    </Servico>
                    <Tomador>
                        <IdentificacaoTomador>
                            <CpfCnpj>
                                <${cleanDoc.length > 11 ? 'Cnpj' : 'Cpf'}>${cleanDoc}</${cleanDoc.length > 11 ? 'Cnpj' : 'Cpf'}>
                            </CpfCnpj>
                        </IdentificacaoTomador>
                        <RazaoSocial>${order.client.name}</RazaoSocial>
                        <Endereco>
                            <Endereco>${order.client.street || 'Endereço não informado'}</Endereco>
                            <Numero>${order.client.number || 'S/N'}</Numero>
                            <Bairro>${order.client.neighborhood || 'Centro'}</Bairro>
                            <CodigoMunicipio>${order.client.cityCode || '2932603'}</CodigoMunicipio>
                            <Uf>${order.client.state || 'BA'}</Uf>
                            <Cep>${cleanZip}</Cep>
                        </Endereco>
                        <Contato>
                            <Email>${order.client.email || ''}</Email>
                        </Contato>
                    </Tomador>
                </InfDeclaracaoPrestacaoServico>
            </Rps>`;
    });

    xml += `
        </ListaRps>
    </LoteRps>
</EnviarLoteRpsEnvio>`;

    return xml;
};

export const downloadRPS = (content: string, batchNumber: number) => {
    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lote_RPS_${batchNumber}_${new Date().toISOString().split('T')[0]}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
