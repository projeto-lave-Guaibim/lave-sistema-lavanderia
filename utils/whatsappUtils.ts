
export const openWhatsApp = (phone: string, message?: string) => {
    // Remove non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Add country code if missing (assuming BR +55 for now if length implies it, or just prepend if it looks like a local number)
    // Simple heuristic: if length is 10 or 11 (DDD + number), prepend 55.
    let finalPhone = cleanPhone;
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
        finalPhone = `55${cleanPhone}`;
    }

    const encodedMessage = message ? encodeURIComponent(message) : '';
    const url = `https://wa.me/${finalPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
    
    window.open(url, '_blank');
};
