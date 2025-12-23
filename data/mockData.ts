
import { Client, Order, OrderStatus, StockItem, Transaction, TransactionType } from '../types';

export const clients: Client[] = [
  { id: 1, name: 'Ana Silva', phone: '(75) 99999-1234', avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGPEgfvVmeRVZEuc4kZcVprgjBeADz2mkSfbIaBjmDVanr_5mjKz51a6ujB5GhBS_GCZYBesdit9FmZxLmAucPtcPUZZ_olfJjW0Xktd8ZS1z5GNUwurTLXHf-nr3-2NGjIFDAujzsiJdjgm1DW2Fw-LIJQFG67w4ZCOJHVORk6yRICIcgZ1eXnQch8Xy45aS04D2vBXSZFG982VjSMKHfgXfN0vLunWYZZFUIpI1JaNMYyszeX9NvJb7cPA1CAoBMxJM1XSe_KgG7", tags: ['Sem Amaciante'], memberSince: 'Out 2022' },
  { id: 2, name: 'Carlos Souza', phone: '(75) 98888-5678', avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC53w8fR5wbCGThvKaO89SJpmP0EHy6lZGaVoNn4iL1BcBhw3J4rijChU3wEGj0MxEtplQ6A9GKgpxgtDdSLSHQF-sY839-8I_9jbfDakAf7CmrCAmfJD2urX4tDjwYnw1eu3yeqEsGA2iHgDuEqQ2jzPwp3B9ZA1JKp0jxKuCgHP841t5EgiBl2MNn9ISoNoTAIXQYf-_Isvd4Le5n1muePcqRQiWROSLaDboovosK2i8c0bWs3GCUo-qzchfjhkbMdVUlKet56MQO", tags: ['Engomar'], memberSince: 'Jan 2023' },
  { id: 3, name: 'Mariana Oliveira', phone: '(75) 97777-4321', avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCiW9omKZXw1uuB7fgwTtIdEWcl4hixGzsSznhp6inJO8VfhuElNikKOy9Qm2L5cRqTTQaGyWwZCk0OEisBVBDFLy6EPNfWPTAUKwmunV6h4NCNy3Sr89YSCDpGbWayjCMaV-L9oX9bloiNhzku3ufcIYfh2ana9z_rBUwrUiwc8EV48BGc3cdWH7FvnuLr2kfhD2Lr2dJfHZLjhd1b_Rm3thChpOOO2o2A3SNV7QRNVKR16jmGubP0R9HAouIWNaQ7u3ZaTg5OBZkO", tags: ['Entrega Expressa'], memberSince: 'Mar 2022' },
  { id: 4, name: 'João Lima', phone: '(75) 99123-4567', initials: 'JL', tags: ['Padrão'], memberSince: 'Fev 2023' },
  { id: 5, name: 'Roberta Santos', phone: '(75) 98822-1111', avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBoCs9CePnvYCoz16MTqXjEYSJMyzOwkREbe-RE0Xe6fdGcofaK_wK1uDS3DQSr4Vxgw9fi47ID4Xyc2yV6ZmzNQEz9G2nYuFPWd1aTrL6aNXlJ_gB22nttbUIu-BEiRLr8ACzq1H7z_QM5rI4b-hShcxavNnYM2TN6f5PKpZbulPnnIiYtsqfIwl36Lz0PZX5HT6qgfyKg7SE75XEzpYEjDpRP1IGyXxMGM8J8SMLS_1SkGmNlwxn26OXYsV7EKhHWkaIwZ_lS9Zv8", tags: ['Cuidado Delicado', 'VIP'], memberSince: 'Set 2021' },
];

export const orders: Order[] = [
  { id: 1024, client: clients[0], service: 'Lavar e Dobrar - 5kg', details: '3kg • Roupas coloridas', timestamp: '14:00', status: OrderStatus.Recebido, value: 45.00 },
  { id: 1025, client: clients[1], service: 'Edredom King Size', details: '1 Edredom King', timestamp: '09:30', status: OrderStatus.Lavando, value: 60.00 },
  { id: 1022, client: { id: 6, name: 'Hotel Mar Azul', phone: '', avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVV7ASu70lsr_w_ApKErOQwF-a1w9T8tml1OYLIifwBoPz0kV6cMmkmpPt5d-UZGCXhHnVa4SwoG8SImVD78nU1SZfKWE2vyc3zDD6Du15g3pYGU0eakRDr6Wzdk0E3BJdzihTDkOJCzCLi6WPRRj3Xmsks_O7yr7W7Bi1WX8pOA4CwyJca8JXKQrlppw1LdRXpuUTaQho3s8MhOwd5nnykF7_qVlXP7Qj3xrTv6Dv5DA6fwJRxK681o_Rpj2Xbjwk1Yt2v1zuPLLv", tags: [], memberSince: '2020' }, service: 'Toalhas (20kg)', details: 'Toalhas', timestamp: 'Ontem, 16:00', status: OrderStatus.Pronto, value: 150.00 },
  { id: 1021, client: { id: 7, name: 'Ana Clara', phone: '', avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgVyfO335TUkcI67dl3gfRUWOS5x_AXk6NWhsJ-38G4RtZK9vNSmr_GMxmzEAt2S5ehs-ywi9n2LBbzoBGm0cHc7xNutIbCo_egoykhEE7aIbQ8eRKiecE-cB0Kat6z76gPTUtfehmTZMe0i2--qmVae1AhhWCNtAZxfeFr-g5Ko4q0YonZ_7mMdmHY8qr4m3nGYoAdadETa3EJzQWz-fuZtu-2oIp8Z3YtEx2wbCQ8HCw7rUlnW1_NMF9ySz1A9_LBZY6vs9c2o8R", tags: [], memberSince: '2022' }, service: 'Terno Completo', details: 'Terno Completo', timestamp: 'Ontem, 10:15', status: OrderStatus.Pronto, value: 85.00 },
  { id: 1020, client: { id: 8, name: 'João Pedro', phone: '', avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdIHSgJjOQdSPE0ZGMnU_RUZZ9d8hUMOjjYG97Ns6SIBKcjyLEvPJ_02UFb4mVyPIPuGtRAPWpfxyqaElFM6xvZGYrEqXt3X7uNxLs4ehqCRhS9Cp5YgWZX0MxUd-O3nJgcFcW_FA0fSzVkiMHFKGNYFSbAYsE6sQiWtkdqE820pcmwstkUxUdrU4FkdzyvtXS4AqJkTV5907owHa23aYTrW71SMvbZ35MczLTraYbJ6Z73UAWdVMVqlX6CBBsKjN9mR0sPVEKrneI", tags: [], memberSince: '2023' }, service: 'Cesto 10kg + Passadoria', details: 'Cesto 10kg + Passadoria', timestamp: 'Ontem, 08:00', status: OrderStatus.Recebido, value: 95.00 },
];


export const stockItems: StockItem[] = [
    { id: 1, name: 'Sabão Líquido Omo', category: 'Lavagem', volume: '5 Litros', quantity: 2, minQuantity: 5 },
    { id: 2, name: 'Amaciante Comfort', category: 'Finalização', volume: '5 Litros', quantity: 12, minQuantity: 3 },
    { id: 3, name: 'Alvejante sem Cloro', category: 'Tira Manchas', volume: '1 Litro', quantity: 0, minQuantity: 4 },
    { id: 4, name: 'Sacolas Plásticas G', category: 'Embalagem', volume: 'Unidade', quantity: 450, minQuantity: 100 },
];

export const transactions: Transaction[] = [
    { id: 1, type: TransactionType.Receita, description: 'Lavagem Edredom King', clientName: 'Maria Silva', date: 'Hoje, 14:30', amount: 60.00, paid: true, icon: 'local_laundry_service' },
    { id: 2, type: TransactionType.Receita, description: 'Pacote 10kg Roupas', clientName: 'João Souza', date: 'Ontem', amount: 45.00, paid: true, icon: 'checkroom' },
    { id: 3, type: TransactionType.Receita, description: 'Lavagem a Seco Terno', clientName: 'Carlos Mendes', date: '23 Out', amount: 85.00, paid: false, icon: 'dry_cleaning' },
    { id: 4, type: TransactionType.Receita, description: 'Tapete Persa 2x2', clientName: 'Ana Paula', date: '21 Out', amount: 120.00, paid: true, icon: 'water_drop' },
    { id: 5, type: TransactionType.Receita, description: 'Passadoria - Cesto G', clientName: 'Pedro Santos', date: '20 Out', amount: 55.00, paid: true, icon: 'iron' },
];
