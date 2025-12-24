
import React from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import { ThemeProvider } from './context/ThemeContext';

// Import screen components
import { LoginScreen, ForgotPasswordScreen } from './screens/AuthScreens';
import DashboardScreen from './screens/DashboardScreen';
import { ClientsListScreen } from './screens/ClientScreens';
import { OrdersListScreen, NewOrderScreen, OrderDetailsScreen } from './screens/OrderScreens';
import { StockControlScreen, AddStockItemScreen, EditStockItemScreen } from './screens/StockScreen';
import { CashFlowScreen, AddTransactionScreen } from './screens/FinanceScreens';
import InvoiceScreen from './screens/InvoiceScreen';
import { ServiceRegistryScreen } from './screens/ServiceRegistryScreen';
import { ItemRegistryScreen } from './screens/ItemRegistryScreen';
import UserScreen from './screens/UserScreen';

import Sidebar from './components/Sidebar';
import { useState } from 'react';

const AppLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="relative flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
                <Outlet context={{ toggleSidebar: () => setIsSidebarOpen(!isSidebarOpen) }} />
                <BottomNav />
            </div>
        </div>
    );
};

import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

const App = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <HashRouter>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<LoginScreen />} />

                        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
                        
                        {/* Protected routes */}
                        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                            <Route path="/dashboard" element={<DashboardScreen />} />
                            <Route path="/clients" element={<ClientsListScreen />} />
                            <Route path="/orders" element={<OrdersListScreen />} />
                            <Route path="/orders/new" element={<NewOrderScreen />} />
                            <Route path="/orders/:orderId" element={<OrderDetailsScreen />} />
                            <Route path="/orders/:orderId/invoice" element={<InvoiceScreen />} />
                            <Route path="/stock" element={<StockControlScreen />} />
                            <Route path="/stock/new" element={<AddStockItemScreen />} />
                            <Route path="/stock/edit/:itemId" element={<EditStockItemScreen />} />
                            <Route path="/services" element={<ServiceRegistryScreen />} />
                            <Route path="/items" element={<ItemRegistryScreen />} />
                            <Route path="/finance" element={<CashFlowScreen />} />
                            <Route path="/finance" element={<CashFlowScreen />} />
                            <Route path="/finance/new" element={<AddTransactionScreen />} />
                            <Route path="/profile" element={<UserScreen />} />
                        </Route>

                    </Routes>
                </HashRouter>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;