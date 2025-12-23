
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/clients', icon: 'group', label: 'Clientes' },
    { path: '/orders', icon: 'local_laundry_service', label: 'Pedidos' },
    { path: '/stock', icon: 'inventory_2', label: 'Estoque' },
    { path: '/finance', icon: 'payments', label: 'Financeiro' },
];

const formPagesWithTopIndicator = {
    '/orders/new': '/orders',
    '/finance/new': '/finance',
    '/stock/new': '/stock', // Assuming a new stock page might exist
};

const BottomNav: React.FC = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    const getActivePath = () => {
        const mappedPath = formPagesWithTopIndicator[currentPath as keyof typeof formPagesWithTopIndicator];
        if (mappedPath) return mappedPath;
        if (currentPath.startsWith('/clients')) return '/clients';
        if (currentPath.startsWith('/orders')) return '/orders';
        if (currentPath.startsWith('/finance')) return '/finance';
        if (currentPath.startsWith('/stock')) return '/stock';
        return currentPath;
    };

    const activePath = getActivePath();
    const isFormPage = Object.keys(formPagesWithTopIndicator).includes(currentPath);
    
    const getNavLinkClass = (path: string) => {
        const isActive = activePath === path;
        return `flex flex-col items-center justify-center w-full h-full text-gray-400 dark:text-gray-500 hover:text-primary transition-colors group relative ${isActive ? 'text-primary' : ''}`;
    };

    if (currentPath === '/orders/new') return null;

    return (
        <nav className="absolute bottom-0 w-full bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 pb-safe z-30 md:hidden">
            <div className="flex w-full items-center justify-around h-[60px] pb-2">
                {navItems.map((item) => {
                    const isActive = activePath === item.path;
                    return (
                        <NavLink key={item.path} to={item.path} className={getNavLinkClass(item.path)}>
                            {isFormPage && isActive && (
                                <div className="absolute -top-2 w-10 h-1 bg-primary rounded-b-full"></div>
                            )}
                            <span className={`material-symbols-outlined text-[24px] mb-1 group-hover:-translate-y-0.5 transition-transform ${!isFormPage && isActive ? 'filled' : ''}`}>
                                {item.icon}
                            </span>
                            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </div>
            <div className="h-5 w-full bg-surface-light/95 dark:bg-surface-dark/95"></div>
        </nav>
    );
};

export default BottomNav;
