import React from 'react';
import { HashRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import screen components
import DashboardScreen from './screens/DashboardScreen';
import { ClientsListScreen } from './screens/ClientScreens';
import { OrdersListScreen, NewOrderScreen, OrderDetailsScreen } from './screens/OrderScreens';
import { TicketScreen } from './screens/TicketScreen';
import { FinanceReportsScreen } from './screens/FinanceReportsScreen';
import { StockControlScreen, AddStockItemScreen, EditStockItemScreen } from './screens/StockScreen';
import InvoiceScreen from './screens/InvoiceScreen';
import { ServiceRegistryScreen } from './screens/ServiceRegistryScreen';
import { ItemRegistryScreen } from './screens/ItemRegistryScreen';
import { PaymentsScreen } from './screens/PaymentsScreen';
import UserScreen from './screens/UserScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import { NewOrderScreenV2 } from './screens/NewOrderScreenV2';
import NewFinanceScreen from './screens/NewFinanceScreen';
import EditFinanceScreen from './screens/EditFinanceScreen';

import Sidebar from './components/Sidebar';
import { useState } from 'react';

const AppLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <ProtectedRoute>
            <div className="relative flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                
                <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
                    <Outlet context={{ toggleSidebar: () => setIsSidebarOpen(!isSidebarOpen) }} />
                    <BottomNav />
                </div>
            </div>
        </ProtectedRoute>
    );
};

const App = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <HashRouter>
                    <Routes>
                        <Route path="/login" element={<LoginScreen />} />
                        <Route path="/" element={<AppLayout />}>
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="dashboard" element={<DashboardScreen />} />
                            <Route path="clients" element={<ClientsListScreen />} />
                            <Route path="orders" element={<OrdersListScreen />} />
                            <Route path="orders/new" element={<NewOrderScreen />} />
                            <Route path="orders/new-v2" element={<NewOrderScreenV2 />} />
                            <Route path="orders/:orderId" element={<OrderDetailsScreen />} />
                            <Route path="orders/:orderId/invoice" element={<InvoiceScreen />} />
                            <Route path="orders/:orderId/ticket" element={<TicketScreen />} />
                            <Route path="stock" element={<StockControlScreen />} />
                            <Route path="stock/new" element={<AddStockItemScreen />} />
                            <Route path="stock/edit/:itemId" element={<EditStockItemScreen />} />
                            <Route path="services" element={<ServiceRegistryScreen />} />
                            <Route path="items" element={<ItemRegistryScreen />} />
                            <Route path="payments" element={<PaymentsScreen />} />
                            <Route path="finance/new" element={<NewFinanceScreen />} />
                            <Route path="finance/edit/:transactionId" element={<EditFinanceScreen />} />
                            <Route path="finance/reports" element={<FinanceReportsScreen />} />
                            <Route path="profile" element={<UserScreen />} />
                        </Route>
                    </Routes>
                </HashRouter>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;