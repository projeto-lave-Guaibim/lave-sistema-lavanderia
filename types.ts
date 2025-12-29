
export enum OrderStatus {
  Recebido = 'Recebido',
  Lavando = 'Lavando',
  Pronto = 'Pronto',
  Entregue = 'Entregue',
  Aguardando = 'Aguardando',
  Pendente = 'Pendente',
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  initials?: string;
  tags: string[];
  memberSince: string;
  type?: 'Pessoa Física' | 'Pessoa Jurídica' | 'Turista';
  email?: string;
  document?: string; // CPF or CNPJ
  notes?: string;
}

export interface Order {
  id: number; // Keep numeric for Order ID as it's auto-increment int8 in DB
  client: Client;
  service: string;
  details: string;
  payment_method?: string;
  timestamp: string;
  status: OrderStatus;
  value?: number;
  extras?: Extra[];
  discount?: number;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  volume: string;
  quantity: number;
  minQuantity: number;
}

export enum TransactionType {
  Receita = 'Receita',
  Despesa = 'Despesa',
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  clientName: string;
  date: string;
  amount: number;
  paid: boolean;
  icon: string;
}

export interface Service {
  id: string;
  name: string;
  type: 'kg' | 'item';
  price: number;
  description?: string;
  icon?: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  price: number;
  icon?: string;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
}

