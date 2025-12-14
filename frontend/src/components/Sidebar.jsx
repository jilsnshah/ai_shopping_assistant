import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Package, ShoppingCart, Users, CreditCard, Settings, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Building2, label: 'Company Info', path: '/company' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: CreditCard, label: 'Payments', path: '/payments' },
    { icon: Settings, label: 'Integrations', path: '/integrations' },
];

import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { googleLogout } from '@react-oauth/google';

export function Sidebar() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await api.get('/logout');
            googleLogout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            // Force navigation even if API fail
            navigate('/login');
        }
    };

    return (
        <div className="h-screen w-64 bg-slate-950 border-r border-slate-800 flex flex-col fixed left-0 top-0">
            <div className="p-6 border-b border-slate-800">
                {/* ... header ... */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <LayoutDashboard className="text-white w-5 h-5" />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        SellerHub
                    </h1>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {sidebarItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-slate-900/50"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1 h-8 bg-indigo-500 rounded-r-full"
                                    />
                                )}
                                <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-400" : "group-hover:text-indigo-400")} />
                                <span className="font-medium">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
