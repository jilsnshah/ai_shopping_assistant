import React, { useEffect, useState } from 'react';
import { Search, Bell, UserCircle, Package, Clock, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

export function TopBar() {
    const [userInfo, setUserInfo] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [recentOrders, setRecentOrders] = useState([]);

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
            // Get last 5 orders, sorted by created_at
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

    return (
        <header className="h-16 bg-slate-950/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative text-slate-400 hover:text-white transition-colors"
                    >
                        <Bell className="w-5 h-5" />
                        {recentOrders.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                    </button>

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
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-slate-800">
                                        <h3 className="text-white font-semibold text-sm">Recent Orders</h3>
                                        <p className="text-slate-500 text-xs mt-0.5">Latest updates from your store</p>
                                    </div>

                                    <div className="max-h-96 overflow-y-auto">
                                        {recentOrders.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                                <p className="text-slate-500 text-sm">No recent orders</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-800">
                                                {recentOrders.map((order) => (
                                                    <div key={order.order_id} className="p-4 hover:bg-slate-800/50 transition-colors">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1">
                                                                <p className="text-white text-sm font-medium">Order #{order.order_id}</p>
                                                                <p className="text-slate-400 text-xs mt-0.5">{order.buyer_phone}</p>
                                                            </div>
                                                            <span className={`text-xs font-medium ${getStatusColor(order.order_status)}`}>
                                                                {order.order_status}
                                                            </span>
                                                        </div>

                                                        {order.items && order.items.length > 0 ? (
                                                            <div className="text-xs text-slate-500 space-y-1">
                                                                {order.items.slice(0, 2).map((item, idx) => (
                                                                    <div key={idx}>
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

                                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50">
                                                            <span className="text-xs text-slate-500">
                                                                {new Date(order.created_at).toLocaleDateString()}
                                                            </span>
                                                            <span className="text-sm font-semibold text-indigo-400">
                                                                ₹{order.total_amount || order.amount}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {recentOrders.length > 0 && (
                                        <div className="p-3 border-t border-slate-800 bg-slate-900/50">
                                            <a
                                                href="/orders"
                                                className="block text-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
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
                <div className="h-8 w-[1px] bg-slate-800"></div>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-900 p-2 rounded-lg transition-colors">
                    {userInfo?.picture ? (
                        <img
                            src={userInfo.picture}
                            alt="Profile"
                            className="w-8 h-8 rounded-full"
                        />
                    ) : (
                        <div className="w-8 h-8 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
                            <UserCircle className="w-5 h-5" />
                        </div>
                    )}
                    <div className="hidden md:block text-sm">
                        <p className="text-white font-medium">{userInfo?.company_name || userInfo?.email || 'Seller Account'}</p>
                        <p className="text-slate-500 text-xs">{userInfo?.email || 'Admin'}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
