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
        <header className={`flex flex-col bg-white dark:bg-[#1a222d] shadow-sm sticky top-0 z-20 transition-colors ${className}`}>
            <div className="flex items-center p-4 justify-between h-[64px]">
                <div className="flex items-center gap-3">
                    {onMenuClick && (
                        <button 
                            onClick={onMenuClick}
                            className="md:hidden flex items-center justify-center size-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#111418] dark:text-white"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    )}
                    
                    {leftIcon ? (
                        leftIcon
                    ) : (
                        // Default back button if no icon provided, but only if not the main dashboard or if explicitly requested? 
                        // Actually, let's leave it empty if undefined, consumer decides.
                        null
                    )}
                    
                    <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] line-clamp-1">
                        {title}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    {rightActions}
                </div>
            </div>

            {showSearch && (
                <div className="px-4 pb-4">
                    <label className="flex w-full items-stretch rounded-xl h-12 bg-[#f0f2f4] dark:bg-[#2a3441] overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
                        <div className="text-[#637288] dark:text-gray-400 flex items-center justify-center pl-4 pr-2">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input 
                            className="flex-1 bg-transparent border-none text-[#111418] dark:text-white placeholder:text-[#637288] dark:placeholder:text-gray-500 focus:ring-0 text-base font-normal leading-normal h-full" 
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
