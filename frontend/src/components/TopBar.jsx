import React, { useEffect, useState } from 'react';
import { Search, Bell, UserCircle, Package, Clock, CheckCircle, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export function TopBar() {
    const [userInfo, setUserInfo] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [recentOrders, setRecentOrders] = useState([]);
    const [searchFocused, setSearchFocused] = useState(false);

    useEffect(() => {
        fetchUserInfo();
        fetchRecentOrders();
    }, []);

    const fetchUserInfo = async () => {
        try {
            const res = await api.get('/seller_info');
            setUserInfo(res.data);
        } catch (error) {
            console.error('Failed to fetch user info:', error);
        }
    };

    const fetchRecentOrders = async () => {
        try {
            const res = await api.get('/orders');
            const orders = (res.data.orders || []).slice(0, 5);
            setRecentOrders(orders);
        } catch (error) {
            console.error('Failed to fetch recent orders:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Pending': 'text-yellow-400',
            'Received': 'text-yellow-400',
            'Ready to Deliver': 'text-blue-400',
            'To Deliver': 'text-indigo-400',
            'Delivered': 'text-emerald-400',
            'Cancelled': 'text-red-400',
        };
        return colors[status] || 'text-slate-400';
    };

    const getStatusBg = (status) => {
        const colors = {
            'Pending': 'bg-yellow-500/10',
            'Received': 'bg-yellow-500/10',
            'Ready to Deliver': 'bg-blue-500/10',
            'To Deliver': 'bg-indigo-500/10',
            'Delivered': 'bg-emerald-500/10',
            'Cancelled': 'bg-red-500/10',
        };
        return colors[status] || 'bg-slate-500/10';
    };

    return (
        <header className="h-16 sticky top-0 z-50 px-8 flex items-center justify-between relative">
            {/* Glass background */}
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/50" />

            {/* Gradient accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

            {/* Search Section */}
            <div className="flex items-center gap-4 flex-1 relative z-10">
                <motion.div
                    className="relative w-96"
                    animate={{
                        scale: searchFocused ? 1.02 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                >
                    <Search className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300",
                        searchFocused ? "text-indigo-400" : "text-slate-500"
                    )} />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        className={cn(
                            "w-full bg-slate-900/80 border rounded-xl pl-11 pr-4 py-2.5 text-sm text-white transition-all duration-300 placeholder:text-slate-500",
                            searchFocused
                                ? "border-indigo-500/50 shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]"
                                : "border-slate-800 hover:border-slate-700"
                        )}
                    />
                    {searchFocused && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-slate-500"
                        >
                            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">⌘K</kbd>
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4 relative z-10">
                {/* Notifications */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={cn(
                            "relative p-2.5 rounded-xl transition-all duration-300",
                            showNotifications
                                ? "bg-indigo-500/20 text-indigo-400"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                        )}
                    >
                        <Bell className="w-5 h-5" />
                        {recentOrders.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse">
                                <span className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                            </span>
                        )}
                    </motion.button>

                    <AnimatePresence>
                        {showNotifications && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowNotifications(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                                    className="absolute right-0 mt-3 w-96 modal-premium z-50 overflow-hidden"
                                >
                                    {/* Header */}
                                    <div className="p-4 border-b border-slate-800/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                                    Recent Orders
                                                </h3>
                                                <p className="text-slate-500 text-xs mt-0.5">Latest updates from your store</p>
                                            </div>
                                            {recentOrders.length > 0 && (
                                                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full">
                                                    {recentOrders.length} new
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                        {recentOrders.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                                    <Package className="w-8 h-8 text-slate-600" />
                                                </div>
                                                <p className="text-slate-400 text-sm font-medium">No recent orders</p>
                                                <p className="text-slate-600 text-xs mt-1">New orders will appear here</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-800/50">
                                                {recentOrders.map((order, index) => (
                                                    <motion.div
                                                        key={order.order_id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="p-4 hover:bg-slate-800/30 transition-colors cursor-pointer group"
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1">
                                                                <p className="text-white text-sm font-medium group-hover:text-indigo-400 transition-colors">
                                                                    Order #{order.order_id}
                                                                </p>
                                                                <p className="text-slate-500 text-xs mt-0.5">{order.buyer_phone}</p>
                                                            </div>
                                                            <span className={cn(
                                                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                                                getStatusColor(order.order_status),
                                                                getStatusBg(order.order_status)
                                                            )}>
                                                                {order.order_status}
                                                            </span>
                                                        </div>

                                                        {order.items && order.items.length > 0 ? (
                                                            <div className="text-xs text-slate-500 space-y-0.5">
                                                                {order.items.slice(0, 2).map((item, idx) => (
                                                                    <div key={idx} className="flex items-center gap-1">
                                                                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                                                                        {item.product_name} x{item.quantity}
                                                                    </div>
                                                                ))}
                                                                {order.items.length > 2 && (
                                                                    <div className="text-slate-600">+{order.items.length - 2} more items</div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-slate-500">{order.product_name}</p>
                                                        )}

                                                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/30">
                                                            <span className="text-xs text-slate-600">
                                                                {new Date(order.created_at).toLocaleDateString()}
                                                            </span>
                                                            <span className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                                                ₹{order.total_amount || order.amount}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    {recentOrders.length > 0 && (
                                        <div className="p-3 border-t border-slate-800/50 bg-slate-900/50">
                                            <a
                                                href="/orders"
                                                className="block text-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                                                onClick={() => setShowNotifications(false)}
                                            >
                                                View All Orders →
                                            </a>
                                        </div>
                                    )}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* Divider */}
                <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-slate-700 to-transparent" />

                {/* User Profile */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-slate-800/50 transition-all duration-300 group"
                >
                    {userInfo?.picture ? (
                        <div className="relative">
                            <img
                                src={userInfo.picture}
                                alt="Profile"
                                className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-800 group-hover:ring-indigo-500/50 transition-all"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950" />
                        </div>
                    ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center text-indigo-400 group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-all">
                            <UserCircle className="w-5 h-5" />
                        </div>
                    )}
                    <div className="hidden md:block text-sm">
                        <p className="text-white font-medium group-hover:text-indigo-200 transition-colors">
                            {userInfo?.company_name || userInfo?.email || 'Seller Account'}
                        </p>
                        <p className="text-slate-500 text-xs">{userInfo?.email || 'Admin'}</p>
                    </div>
                </motion.div>
            </div>
        </header>
    );
}
