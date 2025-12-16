import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../api/axios';
import { cn } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { database } from '../firebase/config';
import { ref, onValue } from 'firebase/database';

const StatCard = ({ title, value, change, icon: Icon, trend }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl relative overflow-hidden group"
    >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon className="w-24 h-24 -rotate-12" />
        </div>
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl">
                <Icon className="w-6 h-6 text-indigo-400" />
            </div>
            {change && (
                <div className={cn("flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg",
                    trend === 'up' ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                )}>
                    {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {change}
                </div>
            )}
        </div>
        <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </motion.div>
);

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        products: 0,
        orders: 0,
        revenue: 0,
        customers: 0,
        revenueChange: 0,
        ordersChange: 0,
        customersChange: 0,
        productsChange: 0
    });
    const [chartData, setChartData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        // Set up Firebase real-time listener for seller data
        const sellerIdSafe = 'jilsnshah_at_gmail_dot_com';
        const sellerRef = ref(database, `sellers/${sellerIdSafe}`);

        const unsubscribe = onValue(sellerRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const dashboardData = {
                    orders: data.orders || [],
                    products: data.products || []
                };
                processDashboardData(dashboardData);
            }
            setLoading(false);
        }, (error) => {
            console.error("Firebase listener error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const processDashboardData = (data) => {
        const { orders, products } = data;
        const now = new Date();

        // Helper to get orders for a specific time range
        const getOrdersBetween = (startDate, endDate) => {
            return orders.filter(o => {
                const date = new Date(o.created_at);
                return date >= startDate && date <= endDate;
            });
        };

        // Monthly Ranges
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const currentMonthOrders = getOrdersBetween(startOfCurrentMonth, now);
        const lastMonthOrders = getOrdersBetween(startOfLastMonth, endOfLastMonth);

        // Calculate Revenue Stats
        const calculateRevenue = (ordList) => ordList.reduce((acc, o) => acc + (o.total_amount || 0), 0);
        const currentRevenue = calculateRevenue(currentMonthOrders);
        const lastRevenue = calculateRevenue(lastMonthOrders);
        const revenueChange = calculatePercentageChange(currentRevenue, lastRevenue);

        // Calculate Order Stats
        const currentOrdersCount = currentMonthOrders.length;
        const lastOrdersCount = lastMonthOrders.length;
        const ordersChange = calculatePercentageChange(currentOrdersCount, lastOrdersCount);

        // Calculate Customer Stats (Unique Phones)
        const getUniqueCustomers = (ordList) => new Set(ordList.map(o => o.buyer_phone)).size;
        const currentCustomers = getUniqueCustomers(currentMonthOrders);
        const lastCustomers = getUniqueCustomers(lastMonthOrders);
        const customersChange = calculatePercentageChange(currentCustomers, lastCustomers);

        // Overall Totals
        const totalRevenue = calculateRevenue(orders);
        const totalCustomers = getUniqueCustomers(orders);

        setStats({
            products: products.length,
            orders: orders.length,
            revenue: totalRevenue,
            customers: totalCustomers,
            revenueChange,
            ordersChange,
            customersChange,
            productsChange: 0 // Can implement if products have created_at
        });

        // 2. Process Chart Data (Last 7 Days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            d.setHours(0, 0, 0, 0);

            const nextDay = new Date(d);
            nextDay.setDate(d.getDate() + 1);

            const dayOrders = getOrdersBetween(d, nextDay);
            const dayRevenue = calculateRevenue(dayOrders);

            last7Days.push({
                name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: dayRevenue,
                orders: dayOrders.length
            });
        }
        setChartData(last7Days);

        // 3. Process Recent Activity
        const sortedOrders = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRecentActivity(sortedOrders.slice(0, 5));
    };

    const calculatePercentageChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-emerald-400">Live</span>
                        </div>
                    </div>
                    <p className="text-slate-400 mt-1">Overview of your store performance</p>
                </div>
                <div className="flex gap-3">
                    <select className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option>Current Month</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(stats.revenue)}
                    change={`${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange.toFixed(1)}%`}
                    trend={stats.revenueChange >= 0 ? 'up' : 'down'}
                    icon={DollarSign}
                />
                <StatCard
                    title="Total Orders"
                    value={stats.orders}
                    change={`${stats.ordersChange >= 0 ? '+' : ''}${stats.ordersChange.toFixed(1)}%`}
                    trend={stats.ordersChange >= 0 ? 'up' : 'down'}
                    icon={ShoppingBag}
                />
                <StatCard
                    title="Active Products"
                    value={stats.products}
                    change="0%"
                    trend="up"
                    icon={Users}
                />
                <StatCard
                    title="Total Customers"
                    value={stats.customers}
                    change={`${stats.customersChange >= 0 ? '+' : ''}${stats.customersChange.toFixed(1)}%`}
                    trend={stats.customersChange >= 0 ? 'up' : 'down'}
                    icon={Users}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6"
                >
                    <h3 className="text-lg font-semibold text-white mb-6">Revenue Analytics (Last 7 Days)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Recent Activity</h3>
                    <div className="space-y-6">
                        {recentActivity.length === 0 ? (
                            <p className="text-slate-500 text-sm">No recent activity</p>
                        ) : (
                            recentActivity.map((order) => (
                                <div key={order.order_id} className="flex gap-4">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 shrink-0"></div>
                                    <div>
                                        <p className="text-sm text-slate-300">
                                            New order <span className="text-indigo-400">#{order.order_id}</span> received
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {formatTimeAgo(order.created_at)} • {formatCurrency(order.total_amount || order.amount)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
