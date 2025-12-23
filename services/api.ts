
export const API_URL = 'https://script.google.com/macros/s/AKfycbwmAjaVwU0NdVPb1d4eFV9QBYk-urR-Y9jDK6P6vGJFdkp9nEBnolei46w7y2NKdbKkVg/exec';

export const api = {
    get: async (sheet: string) => {
        try {
            const response = await fetch(`${API_URL}?action=read&sheet=${sheet}`);
            const data = await response.json();
            if (data.status === 'error') throw new Error(data.message);
            return data; // Expecting array of objects
        } catch (error) {
            console.error(`Error fetching ${sheet}:`, error);
            throw error;
        }
    },
    
    create: async (sheet: string, payload: any) => {
        try {
            // Google Apps Script requires text/plain for CORS to work easily with simple POSTs without preflight issues sometimes, 
            // but standard fetch with JSON usually works if the script handles OPTIONS. 
            // However, the safest way for simple GAS Web Apps is often sending stringified body.
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'create',
                    sheet,
                    payload
                })
            });
            const data = await response.json();
            if (data.status === 'error') throw new Error(data.message);
            return data;
        } catch (error) {
            console.error(`Error creating in ${sheet}:`, error);
            throw error;
        }
    },

    update: async (sheet: string, payload: any) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: 'update',
                    sheet,
                    payload
                })
            });
            const data = await response.json();
            if (data.status === 'error') throw new Error(data.message);
            return data;
        } catch (error) {
            console.error(`Error updating in ${sheet}:`, error);
            throw error;
        }
    },

    post: async (action: string, sheet: string, payload: any) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action,
                    sheet,
                    payload
                })
            });
            const data = await response.json();
            if (data.status === 'error') throw new Error(data.message);
            return data;
        } catch (error) {
            console.error(`Error posting ${action} to ${sheet}:`, error);
            throw error;
        }
    }
};
