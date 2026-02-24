
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/clients', icon: 'group', label: 'Clientes' },
    { path: '/orders', icon: 'local_laundry_service', label: 'Pedidos' },
    { path: '/stock', icon: 'inventory_2', label: 'Estoque' },
];

const formPagesWithTopIndicator = {
    '/orders/new': '/orders',
    '/stock/new': '/stock',
};

const BottomNav: React.FC = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    const getActivePath = () => {
        const mappedPath = formPagesWithTopIndicator[currentPath as keyof typeof formPagesWithTopIndicator];
        if (mappedPath) return mappedPath;
        if (currentPath.startsWith('/clients')) return '/clients';
        if (currentPath.startsWith('/orders')) return '/orders';
        if (currentPath.startsWith('/stock')) return '/stock';
        return currentPath;
    };

    const activePath = getActivePath();
    const isFormPage = Object.keys(formPagesWithTopIndicator).includes(currentPath);
    
    const getNavLinkClass = (path: string) => {
        const isActive = activePath === path;
        return `flex flex-col items-center justify-center w-full h-full transition-colors group relative ${isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-primary'}`;
    };

    if (currentPath === '/orders/new') return null;

    return (
        <nav className="absolute bottom-0 w-full bg-white dark:bg-[#1a222d] border-t border-gray-200 dark:border-gray-700 pb-safe z-30 md:hidden">
            <div className="flex w-full items-center justify-around h-[52px]">
                {navItems.map((item) => {
                    const isActive = activePath === item.path;
                    return (
                        <NavLink key={item.path} to={item.path} className={getNavLinkClass(item.path)}>
                            {isFormPage && isActive && (
                                <div className="absolute -top-px w-8 h-0.5 bg-primary rounded-b"></div>
                            )}
                            <span className={`material-symbols-outlined text-[22px] mb-0.5 ${!isFormPage && isActive ? 'filled' : ''}`}>
                                {item.icon}
                            </span>
                            <span className={`text-[9px] font-medium tracking-wide ${isActive ? 'font-bold' : ''}`}>
                                {item.label.toUpperCase()}
                            </span>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
