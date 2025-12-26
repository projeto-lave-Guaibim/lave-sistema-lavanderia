import { Client, Order, OrderStatus, Service, CatalogItem, Extra } from '../types';

const TABLES = {
    CLIENTS: 'lav_offline_clients',
    ORDERS: 'lav_offline_orders',
    SERVICES: 'lav_offline_services',
    ITEMS: 'lav_offline_items',
    EXTRAS: 'lav_offline_extras'
};

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const getNextId = (items: any[]) => {
    if (items.length === 0) return 1;
    // Assume items have numeric IDs if we are calling this
    const maxId = Math.max(...items.map(i => typeof i.id === 'number' ? i.id : 0));
    return maxId + 1;
};

// Seed initial data if empty
const seedData = () => {
    if (!localStorage.getItem(TABLES.SERVICES)) {
        const initialServices: Service[] = [
            { id: generateUUID(), name: 'Lavar e Secar', type: 'kg', price: 15.00, description: 'Serviço completo por quilo' },
            { id: generateUUID(), name: 'Passar', type: 'item', price: 5.00, description: 'Passadoria por peça' },
            { id: generateUUID(), name: 'Edredom', type: 'item', price: 40.00, description: 'Lavagem de edredom' }
        ];
        localStorage.setItem(TABLES.SERVICES, JSON.stringify(initialServices));
    }
    if (!localStorage.getItem(TABLES.EXTRAS)) {
        const initialExtras = [
            { id: generateUUID(), name: 'Amaciante Premium', price: 2.00 },
            { id: generateUUID(), name: 'Entrega Express', price: 10.00 }
        ];
        localStorage.setItem(TABLES.EXTRAS, JSON.stringify(initialExtras));
    }
    if (!localStorage.getItem(TABLES.ITEMS)) {
        const initialItems = [
            { id: generateUUID(), name: 'Camisa Social', category: 'Roupas', price: 8.00 },
            { id: generateUUID(), name: 'Calça Jeans', category: 'Roupas', price: 10.00 }
        ];
        localStorage.setItem(TABLES.ITEMS, JSON.stringify(initialItems));
    }
    if (!localStorage.getItem(TABLES.CLIENTS)) {
        const initialClients: Client[] = [
             { id: generateUUID(), name: 'Cliente Teste', phone: '(75) 99999-9999', email: 'teste@email.com', type: 'Pessoa Física', notes: '', tags: [], memberSince: '2024'}
        ];
        localStorage.setItem(TABLES.CLIENTS, JSON.stringify(initialClients));
    }
};

export const offlineStorage = {
    init: () => {
        seedData();
    },

    // Generic Get
    getAll: <T>(table: string): T[] => {
        const data = localStorage.getItem(table);
        return data ? JSON.parse(data) : [];
    },

    // Generic Add
    add: <T>(table: string, item: T): T => {
        const items = offlineStorage.getAll<T>(table);
        const newItem = { ...item } as any;
        
        // Auto ID generation
        if (table === TABLES.ORDERS) {
            newItem.id = getNextId(items); // Integer for orders
            newItem.created_at = new Date().toISOString();
        } else {
            newItem.id = generateUUID(); // UUID for others
        }
        
        items.push(newItem);
        localStorage.setItem(table, JSON.stringify(items));
        return newItem;
    },

    // Generic Update
    update: <T extends { id: any }>(table: string, item: T): T => {
        const items = offlineStorage.getAll<T>(table);
        const index = items.findIndex(i => i.id === item.id);
        if (index !== -1) {
            items[index] = { ...items[index], ...item };
            localStorage.setItem(table, JSON.stringify(items));
            return items[index];
        }
        throw new Error('Item not found');
    },

    // Generic Delete
    delete: (table: string, id: any) => {
        const items = offlineStorage.getAll<any>(table);
        const filtered = items.filter(i => i.id !== id);
        localStorage.setItem(table, JSON.stringify(filtered));
    },

    TABLES
};
