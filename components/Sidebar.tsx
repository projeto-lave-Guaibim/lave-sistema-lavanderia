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
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { user } = useAuth();
    
    const getNavLinkClass = (isActive: boolean) => {
        return `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            isActive 
                ? 'bg-primary/10 text-primary font-bold' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium'
        }`;
    };

    const sidebarContent = (
        <div className="flex flex-col h-full bg-white dark:bg-[#1a222d] border-r border-gray-200 dark:border-gray-800 w-64 transition-colors">
            <div className="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex size-10 shrink-0 items-center justify-center bg-primary/10 rounded-full">
                    <span className="material-symbols-outlined text-primary">local_laundry_service</span>
                </div>
                <div>
                    <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight">Lavê</h2>
                    <p className="text-[#637288] dark:text-gray-400 text-xs font-medium">Sistema de Gestão</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink 
                        key={item.path} 
                        to={item.path} 
                        className={({ isActive }) => getNavLinkClass(isActive)}
                        onClick={() => {
                            // Close sidebar on mobile when item is clicked
                            if (window.innerWidth < 768) {
                                onClose();
                            }
                        }}
                    >
                        <span className={`material-symbols-outlined ${location.pathname === item.path ? 'filled' : ''}`}>
                            {item.icon}
                        </span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <NavLink to="/profile" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className="bg-center bg-no-repeat bg-cover rounded-full size-10" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDmPHpIUE4i7dS3UbI0BA_gk9yiQN9Z0yJsG5-mxJAvUVyKsWC8oBO1q4hJMDbSzQXBazNDO8iksfWNSzT9VChGaOhuRS4fAAxnW8zH5smroyIX9io6EVNx_79v_a3EQhLaPgbtX4o8eJ89svXZp1NXGkM36DXNbeBHw_2k52jGTgZhS4TvNu8m71ujnClsidaHfX86yz97Jv6BJlYS7zG7l9tHqk8_Du8_VLo-9H2G7XCouSi1g1ryzaVTJ7Ks8-SxRub7LwWl5GKa")` }}></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name || 'Usuário'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email || 'email@exemplo.com'}</p>
                    </div>
                </NavLink>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar - Always visible on md+ */}
            <div className="hidden md:block h-full shrink-0">
                {sidebarContent}
            </div>

            {/* Mobile Sidebar - Drawer */}
            <div className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                ></div>
                
                {/* Drawer */}
                <div className={`absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-[#1a222d] shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {sidebarContent}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
