# 🧺 Lavê - Sistema de Gerenciamento de Lavanderia

Sistema completo de gestão para lavanderias, desenvolvido com React + TypeScript + Supabase. Uma solução moderna, responsiva e segura para gerenciar pedidos, clientes, estoque e finanças.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6.svg)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e.svg)

---

## ✨ Funcionalidades

### 🔐 Autenticação e Segurança
- **Login seguro** com Supabase Auth
- **Controle de acesso** baseado em roles (Admin/Usuário)
- **Row Level Security (RLS)** implementado em todas as tabelas
- **Persistência de sessão** entre reloads

### 📦 Gestão de Pedidos
- **Criação e edição** de pedidos de lavanderia
- **Rastreamento de status** (Recebido, Lavando, Pronto, Entregue)
- **Histórico completo** de pedidos por cliente
- **Cálculo automático** de valores com extras
- **Integração com WhatsApp** para compartilhar detalhes

### 👥 Gestão de Clientes
- **Cadastro completo** de clientes (Pessoa Física/Jurídica)
- **Histórico de pedidos** por cliente
- **Tags personalizadas** para categorização
- **Contato direto** via WhatsApp
- **Edição e exclusão** de registros

### 💰 Controle Financeiro
- **Registro de receitas e despesas**
- **Visualização de fluxo de caixa**
- **Filtros por período** e tipo de transação
- **Gráficos e estatísticas**
- **Exclusão restrita** a administradores

### 📊 Gestão de Estoque
- **Controle de produtos** e suprimentos
- **Alertas de estoque baixo**
- **Categorização** de itens
- **Histórico de movimentações**

### 🎨 Interface Premium
- **Design moderno** e responsivo
- **Dark mode** suportado
- **Animações suaves** e micro-interações
- **PWA** - Instalável como app nativo
- **Otimizado para mobile e desktop**

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18.3** - Biblioteca UI
- **TypeScript 5.5** - Tipagem estática
- **React Router 6.28** - Roteamento SPA
- **Vite 6.0** - Build tool ultrarrápido
- **CSS Modules** - Estilização com vanilla CSS

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Row Level Security (RLS)
  - Realtime subscriptions

### PWA & Deployment
- **vite-plugin-pwa** - Progressive Web App
- **Workbox** - Service Worker para cache offline

### Utilitários
- **React Icons** - Ícones (Material Symbols)
- **date-fns** - Manipulação de datas
- **Chart.js / Recharts** - Visualização de dados

---

## 🚀 Instalação e Configuração

### Pré-requisitos
- **Node.js** 18+ e **npm** (ou yarn/pnpm)
- Conta no **Supabase** ([supabase.com](https://supabase.com))

### 1. Clone o repositório

```bash
git clone https://github.com/projeto-lave-Guaibim/lave-sistema-lavanderia.git
cd lave-sistema-lavanderia
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
```

> ⚠️ **IMPORTANTE**: Nunca compartilhe suas credenciais do Supabase publicamente. O arquivo `.env` já está no `.gitignore`.

**Como obter as credenciais:**
1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **Settings** → **API**
3. Copie a **URL** e a **anon/public key**

### 4. Configure o banco de dados

Execute os scripts SQL no Supabase SQL Editor (disponíveis na pasta `/docs` ou conforme documentação):

```sql
-- Criar tabelas principais
CREATE TABLE users (...);
CREATE TABLE clients (...);
CREATE TABLE orders (...);
CREATE TABLE finance (...);
CREATE TABLE stock (...);
-- ... outras tabelas

-- Habilitar RLS e criar políticas de segurança
-- ... (ver scripts completos)
```

### 5. Execute o projeto

**Modo desenvolvimento:**
```bash
npm run dev
```

**Build para produção:**
```bash
npm run build
npm run preview
```

O app estará disponível em `http://localhost:5173`

---

## 📁 Estrutura do Projeto

```
lave-sistema-lavanderia/
├── public/              # Arquivos estáticos e ícones PWA
├── src/
│   ├── components/      # Componentes reutilizáveis
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── BottomNav.tsx
│   ├── context/         # Context API (AuthContext)
│   ├── screens/         # Telas principais
│   │   ├── AuthScreens.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── OrderScreens.tsx
│   │   ├── ClientScreens.tsx
│   │   ├── FinanceScreens.tsx
│   │   └── StockScreen.tsx
│   ├── services/        # Integração com Supabase
│   │   ├── supabaseClient.ts
│   │   ├── authService.ts
│   │   ├── orderService.ts
│   │   ├── clientService.ts
│   │   ├── financeService.ts
│   │   └── stockService.ts
│   ├── utils/           # Funções utilitárias
│   ├── types.ts         # Definições TypeScript
│   ├── App.tsx          # Componente raiz
│   └── main.tsx         # Entry point
├── .env                 # Variáveis de ambiente (NÃO COMMITAR)
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🔒 Segurança

### Row Level Security (RLS)
Todas as tabelas possuem políticas RLS implementadas:

- **Configurações** (services, catalog_items, extras): Apenas admins podem modificar
- **Clientes e Estoque**: Todos podem ler/criar/editar, apenas admins podem deletar
- **Pedidos e Finanças**: Todos podem ler/criar/editar, apenas admins podem deletar
- **Usuários**: Cada usuário só pode editar seu próprio perfil

### Autenticação
- Senhas criptografadas via Supabase Auth
- Token JWT para autenticação de requisições
- Logout automático em caso de sessão expirada

---

## 👨‍💻 Uso do Sistema

### Login Inicial
1. Acesse a aplicação
2. Use suas credenciais cadastradas no Supabase
3. O sistema redirecionará para o dashboard

### Criando um Pedido
1. Vá em **Pedidos** → **Novo Pedido**
2. Selecione o cliente
3. Escolha o serviço e adicione detalhes
4. Adicione extras se necessário
5. Confirme o valor e salve

### Gerenciando Finanças
1. Acesse **Financeiro**
2. Adicione receitas/despesas manualmente
3. Visualize o fluxo de caixa por período
4. (Admin) Exclua lançamentos incorretos

---

## 🎨 Screenshots

> 💡 Adicione capturas de tela do sistema aqui para melhor visualização

---

## 📱 PWA - Progressive Web App

O sistema pode ser instalado como um aplicativo nativo:

**Desktop:**
- Chrome/Edge: Clique no ícone de instalação na barra de endereços
- Safari: Não suportado nativamente

**Mobile:**
- Android: "Adicionar à tela inicial"
- iOS: Safari → Compartilhar → "Adicionar à Tela de Início"

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🐛 Reportar Bugs

Encontrou um bug? Abra uma [issue](https://github.com/projeto-lave-Guaibim/lave-sistema-lavanderia/issues) descrevendo:
- O que aconteceu
- O que era esperado
- Passos para reproduzir
- Screenshots (se aplicável)

---

## 📧 Contato

**Projeto Lavê Guaibim**
- Email: contato.laveguaibim@gmail.com
- GitHub: [@projeto-lave-Guaibim](https://github.com/projeto-lave-Guaibim)

---

## 🙏 Agradecimentos

- [Supabase](https://supabase.com) - Backend as a Service
- [Vite](https://vitejs.dev) - Build tool
- [React](https://react.dev) - UI Library

---

<div align="center">
  Feito com ❤️ para a Lavanderia Guaibim
</div>
