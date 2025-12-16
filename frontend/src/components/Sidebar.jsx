import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Package, ShoppingCart, Users, CreditCard, RefreshCcw, Settings, Workflow, LogOut, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer } from './Toast';
import { useToast } from '../hooks/useToast';
import api from '../api/axios';
import { googleLogout } from '@react-oauth/google';

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', enabled: true },
    { icon: Building2, label: 'Company Info', path: '/company', enabled: true },
    { icon: Package, label: 'Products', path: '/products', enabled: true },
    { icon: ShoppingCart, label: 'Orders', path: '/orders', enabled: true },
    { icon: Users, label: 'Customers', path: '/customers', enabled: true },
    { icon: CreditCard, label: 'Payments', path: '/payments', enabled: true },
    { icon: RefreshCcw, label: 'Cancellations', path: '/cancellations', enabled: false },
    { icon: Workflow, label: 'Automation', path: '/automation', enabled: false },
    { icon: Settings, label: 'Integrations', path: '/integrations', enabled: false },
];

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toasts, removeToast, info } = useToast();

    const handleLogout = async () => {
        try {
            await api.get('/logout');
            googleLogout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            navigate('/login');
        }
    };

    const handleItemClick = (e, item) => {
        if (!item.enabled) {
            e.preventDefault();
            info(`${item.label} - Coming Soon! 🚀`);
        }
    };

    return (
        <div className="h-screen w-64 fixed left-0 top-0 sidebar-premium flex flex-col">
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {/* Gradient overlay at top */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

            {/* Logo Section */}
            <div className="p-6 border-b border-slate-800/50 relative">
                <div className="flex items-center gap-3">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30"
                    >
                        <LayoutDashboard className="text-white w-5 h-5" />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-pulse opacity-50 blur-sm" />
                    </motion.div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-200">
                            SellerHub
                        </h1>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI-Powered Commerce
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                {sidebarItems.map((item, index) => {
                    const isActive = location.pathname === item.path;

                    return (
                        <motion.div
                            key={item.path}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <NavLink
                                to={item.path}
                                onClick={(e) => handleItemClick(e, item)}
                                className={cn(
                                    "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                                    isActive
                                        ? "bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent text-white"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                                    !item.enabled && "opacity-50"
                                )}
                            >
                                {/* Active indicator bar */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Hover glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* Icon */}
                                <div className={cn(
                                    "relative z-10 p-2 rounded-lg transition-all duration-300",
                                    isActive
                                        ? "bg-indigo-500/20 text-indigo-400"
                                        : "text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10"
                                )}>
                                    <item.icon className="w-4 h-4" />
                                </div>

                                {/* Label */}
                                <span className="relative z-10 font-medium text-sm">{item.label}</span>

                                {/* Coming Soon badge */}
                                {!item.enabled && (
                                    <span className="ml-auto text-[10px] bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                                        Soon
                                    </span>
                                )}
                            </NavLink>
                        </motion.div>
                    );
                })}
            </nav>

            {/* Logout Section */}
            <div className="p-4 border-t border-slate-800/50">
                <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 rounded-xl transition-all duration-300 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 p-2 rounded-lg group-hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-4 h-4" />
                    </div>
                    <span className="relative z-10 font-medium text-sm">Logout</span>
                </motion.button>
            </div>

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-indigo-500/5 to-transparent pointer-events-none" />
        </div>
    );
}
