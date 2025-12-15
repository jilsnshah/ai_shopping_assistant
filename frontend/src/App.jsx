import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Company from './pages/Company';
import Customers from './pages/Customers';
import Payments from './pages/Payments';
import Integrations from './pages/Integrations';
import Automation from './pages/Automation';

// Simple wrapper to check for session. 
// We rely on the API returning 401 to redirect to login via axios interceptor.
const ProtectedLayout = () => {
    return <DashboardLayout />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/onboarding" element={<Onboarding />} />

                <Route path="/" element={<ProtectedLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<Products />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="company" element={<Company />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="payments" element={<Payments />} />
                    <Route path="integrations" element={<Integrations />} />
                    <Route path="automation" element={<Automation />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
