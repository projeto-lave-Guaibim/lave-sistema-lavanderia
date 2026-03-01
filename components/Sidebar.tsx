import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const navItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/clients', icon: 'group', label: 'Clientes' },
    { path: '/orders', icon: 'local_laundry_service', label: 'Pedidos' },
    { path: '/stock', icon: 'inventory_2', label: 'Estoque' },
    { path: '/services', icon: 'dry_cleaning', label: 'Serviços' },
    { path: '/items', icon: 'checkroom', label: 'Peças' },
    { path: '/payments', icon: 'account_balance_wallet', label: 'Pagamentos' },
    { path: '/finance/reports', icon: 'assessment', label: 'Relatórios' },
    { path: '/metrics', icon: 'monitoring', label: 'Métricas' },
    { path: '/finance/contracts', icon: 'receipt_long', label: 'Contratos' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { user } = useAuth();
    
    const getNavLinkClass = (isActive: boolean) => {
        return `flex items-center gap-2.5 px-3 py-2 rounded transition-all duration-100 text-sm ${
            isActive 
                ? 'bg-primary text-white font-semibold' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white font-medium'
        }`;
    };

    const sidebarContent = (
        <div className="flex flex-col h-full bg-white dark:bg-[#1a222d] border-r border-gray-200 dark:border-gray-700 w-56 transition-colors">
            {/* Logo header — compact like Silbeck */}
            <div className="flex items-center gap-2.5 px-4 py-3 bg-primary border-b border-primary-dark">
                <span className="material-symbols-outlined text-white text-[18px]">local_laundry_service</span>
                <div>
                    <h2 className="text-white text-sm font-bold leading-tight tracking-wide">LAVÊ</h2>
                    <p className="text-blue-200 text-[10px] font-medium tracking-wider uppercase">Sistema de Gestão</p>
                </div>
            </div>

            {/* Navigation — dense compact list */}
            <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink 
                        key={item.path} 
                        to={item.path} 
                        className={({ isActive }) => getNavLinkClass(isActive)}
                        onClick={() => {
                            if (window.innerWidth < 768) onClose();
                        }}
                    >
                        <span className={`material-symbols-outlined text-[16px] ${location.pathname === item.path ? 'filled' : ''}`}>
                            {item.icon}
                        </span>
                        <span className="text-[13px]">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User footer — slim */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <NavLink to="/profile" className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[15px]">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'Usuário'}</p>
                        <p className="text-[10px] text-gray-500 truncate">{user?.role || 'Operador'}</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 text-[14px]">settings</span>
                </NavLink>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:block h-full shrink-0">
                {sidebarContent}
            </div>

            {/* Mobile Drawer */}
            <div className={`fixed inset-0 z-50 md:hidden transition-opacity duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
                <div className={`absolute left-0 top-0 bottom-0 w-56 shadow-xl transform transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {sidebarContent}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
