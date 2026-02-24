import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
    title: string;
    leftIcon?: React.ReactNode;
    rightActions?: React.ReactNode;
    showSearch?: boolean;
    onSearch?: (term: string) => void;
    onMenuClick?: () => void;
    className?: string;
}

const Header: React.FC<HeaderProps> = ({ 
    title, 
    leftIcon, 
    rightActions, 
    showSearch, 
    onSearch,
    onMenuClick,
    className = ''
}) => {
    const navigate = useNavigate();

    return (
        <header className={`flex flex-col bg-white dark:bg-[#1a222d] border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 transition-colors ${className}`}>
            <div className="flex items-center px-4 py-2 justify-between min-h-[48px]">
                <div className="flex items-center gap-2">
                    {onMenuClick && (
                        <button 
                            onClick={onMenuClick}
                            className="md:hidden flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                        >
                            <span className="material-symbols-outlined text-[18px]">menu</span>
                        </button>
                    )}
                    
                    {leftIcon && leftIcon}
                    
                    <h2 className="text-[#111418] dark:text-white text-sm font-semibold leading-tight tracking-[-0.01em] line-clamp-1">
                        {title}
                    </h2>
                </div>

                <div className="flex items-center gap-1.5">
                    {rightActions}
                </div>
            </div>

            {showSearch && (
                <div className="px-4 pb-2">
                    <label className="flex w-full items-stretch h-9 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-shadow">
                        <div className="text-gray-400 flex items-center justify-center pl-3 pr-2">
                            <span className="material-symbols-outlined text-[16px]">search</span>
                        </div>
                        <input 
                            className="flex-1 bg-transparent border-none text-[#111418] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-0 text-sm font-normal leading-normal h-full" 
                            placeholder="Buscar..." 
                            onChange={(e) => onSearch && onSearch(e.target.value)} 
                        />
                    </label>
                </div>
            )}
        </header>
    );
};

export default Header;
