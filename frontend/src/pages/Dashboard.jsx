import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight, MessageSquare, Power, X, Sparkles, Activity, Zap, Link2 } from 'lucide-react';
import api from '../api/axios';
import { cn } from '../lib/utils';
import { staggerContainer, staggerItem, fadeInUp } from '../lib/motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { database } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { Sparkline } from '../components/Sparkline';
import { SkeletonStatCard, SkeletonChart } from '../components/Skeleton';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';

const StatCard = ({ title, value, change, icon: Icon, trend, gradient, delay = 0, sparklineData = [] }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay * 0.1, duration: 0.5 }}
        whileHover={{ y: -5, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="stat-card group noise-overlay"
    >
        {/* Gradient overlay on hover */}
        <div className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl",
            gradient
        )} />

        {/* Background icon */}
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon className="w-32 h-32 -rotate-12" />
        </div>

        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className={cn(
                    "p-3 rounded-xl transition-all duration-300",
                    "bg-gradient-to-br from-indigo-500/20 to-purple-500/10 group-hover:from-indigo-500/30 group-hover:to-purple-500/20"
                )}>
                    <Icon className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="flex items-center gap-2">
                    {/* Mini Sparkline */}
                    {sparklineData.length > 0 && (
                        <Sparkline
                            data={sparklineData}
                            width={50}
                            height={20}
                            color={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6366f1'}
                        />
                    )}
                    {change && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: delay * 0.1 + 0.3 }}
                            className={cn(
                                "flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-lg",
                                trend === 'up'
                                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                    : "text-red-400 bg-red-500/10 border border-red-500/20"
                            )}
                        >
                            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {change}
                        </motion.div>
                    )}
                </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold text-white mt-1 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                {value}
            </p>
        </div>
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

    // AI Assistant state
    const [aiAssistantActive, setAiAssistantActive] = useState(false);
    const [showCredentialsForm, setShowCredentialsForm] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [whatsappCreds, setWhatsappCreds] = useState({
        phone_number_id: '',
        business_account_id: '',
        access_token: '',
        verify_token: ''
    });

    // Check WhatsApp AI status on mount
    useEffect(() => {
        const checkWhatsAppStatus = async () => {
            try {
                const response = await api.get('/whatsapp/status');
                setAiAssistantActive(response.data.active);
            } catch (error) {
                console.error('Failed to check WhatsApp status:', error);
            }
        };
        checkWhatsAppStatus();
    }, []);

    // Handle WhatsApp activation
    const handleActivateWhatsApp = async () => {
        if (!whatsappCreds.phone_number_id || !whatsappCreds.business_account_id ||
            !whatsappCreds.access_token || !whatsappCreds.verify_token) {
            alert('Please fill in all fields');
            return;
        }

        setAiLoading(true);
        try {
            await api.post('/whatsapp/activate', whatsappCreds);
            setAiAssistantActive(true);
            setShowCredentialsForm(false);
            setWhatsappCreds({ phone_number_id: '', business_account_id: '', access_token: '', verify_token: '' });
        } catch (error) {
            console.error('Failed to activate WhatsApp:', error);
            alert('Failed to activate. Please check your credentials.');
        } finally {
            setAiLoading(false);
        }
    };

    // Handle WhatsApp deactivation
    const handleDeactivateWhatsApp = async () => {
        if (!confirm('Are you sure you want to deactivate the AI Assistant?')) return;

        setAiLoading(true);
        try {
            await api.post('/whatsapp/deactivate');
            setAiAssistantActive(false);
        } catch (error) {
            console.error('Failed to deactivate WhatsApp:', error);
            alert('Failed to deactivate. Please try again.');
        } finally {
            setAiLoading(false);
        }
    };

    // Initialize Facebook SDK for WhatsApp Embedded Signup
    useEffect(() => {
        // Load Facebook SDK
        window.fbAsyncInit = function () {
            window.FB.init({
                appId: '2227135407795713',
                autoLogAppEvents: true,
                xfbml: true,
                version: 'v24.0'
            });
        };

        // Load SDK script if not already loaded
        if (!document.getElementById('facebook-jssdk')) {
            const script = document.createElement('script');
            script.id = 'facebook-jssdk';
            script.src = 'https://connect.facebook.net/en_US/sdk.js';
            script.async = true;
            script.defer = true;
            script.crossOrigin = 'anonymous';
            document.body.appendChild(script);
        }
    }, []);

    // Launch WhatsApp Embedded Signup
    const launchWhatsAppSignup = () => {
        if (!window.FB) {
            alert('Facebook SDK is still loading. Please try again in a moment.');
            return;
        }

        window.FB.login(function (response) {
            console.log('FB.login full response:', JSON.stringify(response, null, 2));

            if (response.authResponse) {
                const code = response.authResponse.code;
                console.log('Got auth code:', code ? code.substring(0, 50) + '...' : 'undefined');

                if (code) {
                    console.log('Sending auth code to backend for token exchange...');
                    connectWhatsAppWithCode(code);
                } else {
                    console.error('No code in authResponse:', response.authResponse);
                    alert('Authentication failed - no authorization code received. Please try again.');
                }
            } else {
                console.log('User cancelled login or did not fully authorize.');
            }
        }, {
            config_id: '738354569319003', // WhatsApp Embedded Signup Configuration
            response_type: 'code',  // WhatsApp Embedded Signup only supports code flow
            override_default_response_type: true,
            extras: {
                setup: {},
                featureType: '',
                sessionInfoVersion: 2
            }
        });
    };


    // Handle code exchange (when response_type is 'code')
    const connectWhatsAppWithCode = async (code) => {
        setAiLoading(true);
        try {
            const response = await api.post('/whatsapp/connect', { code: code });
            if (response.data.success) {
                setAiAssistantActive(true);
                const businessName = response.data.business_name || 'WhatsApp Business';
                const phoneDisplay = response.data.phone_display || '';
                alert(`✅ ${businessName} connected successfully!\n${phoneDisplay ? `Phone: ${phoneDisplay}` : ''}`);
            } else {
                throw new Error(response.data.error || 'Connection failed');
            }
        } catch (error) {
            console.error('Failed to connect WhatsApp:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to connect WhatsApp';
            alert(`❌ ${errorMsg}\n\nPlease try again or use manual activation.`);
        } finally {
            setAiLoading(false);
        }
    };

    // Send access token to backend and complete WhatsApp connection
    const connectWhatsAppBackend = async (accessToken) => {
        console.log('connectWhatsAppBackend called with accessToken:', accessToken);
        console.log('accessToken type:', typeof accessToken);
        console.log('accessToken length:', accessToken?.length);

        if (!accessToken) {
            console.error('No accessToken provided to connectWhatsAppBackend!');
            alert('❌ No access token received from Facebook. Please try again.');
            return;
        }

        setAiLoading(true);
        try {
            console.log('Sending to backend:', { access_token: accessToken.substring(0, 50) + '...' });
            const response = await api.post('/whatsapp/connect', { access_token: accessToken });
            if (response.data.success) {
                setAiAssistantActive(true);
                const businessName = response.data.business_name || 'WhatsApp Business';
                const phoneDisplay = response.data.phone_display || '';
                alert(`✅ ${businessName} connected successfully!\n${phoneDisplay ? `Phone: ${phoneDisplay}` : ''}`);
            } else {
                throw new Error(response.data.error || 'Connection failed');
            }
        } catch (error) {
            console.error('Failed to connect WhatsApp:', error);
            console.error('Error response:', error.response?.data);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to connect WhatsApp';
            alert(`❌ ${errorMsg}\n\nPlease try again or use manual activation.`);
        } finally {
            setAiLoading(false);
        }
    };


    // State for seller ID
    const [sellerId, setSellerId] = useState(null);
    const { firebaseReady } = useFirebaseAuth();

    // Fetch seller info on mount
    useEffect(() => {
        const fetchSellerInfo = async () => {
            try {
                const response = await api.get('/seller_info');
                if (response.data && response.data.id) {
                    setSellerId(response.data.id);
                } else {
                    console.error("No seller ID returned from API");
                }
            } catch (error) {
                console.error("Error fetching seller info:", error);
            }
        };

        fetchSellerInfo();
    }, []);

    useEffect(() => {
        if (!sellerId) return;

        const sanitizeEmail = (email) =>
            email.replace(/\./g, '_dot_').replace(/@/g, '_at_').replace(/\//g, '_slash_');

        // --- Real-time path (Firebase authenticated) ---
        if (firebaseReady) {
            const sellerIdSafe = sanitizeEmail(sellerId);
            const sellerRef = ref(database, `sellers/${sellerIdSafe}`);
            const customersRef = ref(database, `sellers/${sellerIdSafe}/customers`);

            let dashboardData = { orders: [], products: [] };
            let customerIds = [];

            const processData = () => processDashboardData(dashboardData, customerIds);

            const processArray = (arr) => {
                if (!arr) return [];
                return Array.isArray(arr) ? arr : Object.values(arr);
            };

            const unsubscribeSeller = onValue(sellerRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    dashboardData = {
                        orders: processArray(data.orders),
                        products: processArray(data.products)
                    };
                } else {
                    dashboardData = { orders: [], products: [] };
                }
                processData();
                setLoading(false);
            }, (error) => {
                console.error('Firebase dashboard error:', error);
                setLoading(false);
            });

            const unsubscribeCustomers = onValue(customersRef, (snapshot) => {
                const data = snapshot.val();
                customerIds = data
                    ? (Array.isArray(data) ? data : Object.keys(data))
                    : [];
                processData();
            });

            return () => { unsubscribeSeller(); unsubscribeCustomers(); };
        }

        // --- Fallback path (API) when Firebase auth is not ready ---
        const fetchData = async () => {
            try {
                const [ordersRes, productsRes] = await Promise.all([
                    api.get('/orders'),
                    api.get('/products')
                ]);
                const dashboardData = {
                    orders: ordersRes.data.orders || [],
                    products: productsRes.data.products || []
                };
                const customerIds = [...new Set((ordersRes.data.orders || []).map(o => o.buyer_phone).filter(Boolean))];
                processDashboardData(dashboardData, customerIds);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, [sellerId, firebaseReady]);

    const processDashboardData = (data, customerIds) => {
        const { orders, products } = data;
        const now = new Date();

        const getOrdersBetween = (startDate, endDate) => {
            return orders.filter(o => {
                const date = new Date(o.created_at);
                return date >= startDate && date <= endDate;
            });
        };

        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const currentMonthOrders = getOrdersBetween(startOfCurrentMonth, now);
        const lastMonthOrders = getOrdersBetween(startOfLastMonth, endOfLastMonth);

        const calculateRevenue = (ordList) => ordList.reduce((acc, o) => acc + (o.total_amount || 0), 0);
        const currentRevenue = calculateRevenue(currentMonthOrders);
        const lastRevenue = calculateRevenue(lastMonthOrders);
        const revenueChange = calculatePercentageChange(currentRevenue, lastRevenue);

        const currentOrdersCount = currentMonthOrders.length;
        const lastOrdersCount = lastMonthOrders.length;
        const ordersChange = calculatePercentageChange(currentOrdersCount, lastOrdersCount);

        const totalCustomers = customerIds.length;
        const getUniqueCustomers = (ordList) => new Set(ordList.map(o => o.buyer_phone)).size;
        const currentCustomers = getUniqueCustomers(currentMonthOrders);
        const lastCustomers = getUniqueCustomers(lastMonthOrders);
        const customersChange = calculatePercentageChange(currentCustomers, lastCustomers);

        const totalRevenue = calculateRevenue(orders);

        setStats({
            products: products.length,
            orders: orders.length,
            revenue: totalRevenue,
            customers: totalCustomers,
            revenueChange,
            ordersChange,
            customersChange,
            productsChange: 0
        });

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 rounded-full animate-spin border-t-indigo-500" />
                    <Sparkles className="w-5 h-5 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Credentials Form Modal */}
            {showCredentialsForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="modal-premium p-6 w-full max-w-md mx-4"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl">
                                    <Zap className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Activate AI Assistant</h3>
                            </div>
                            <button
                                onClick={() => setShowCredentialsForm(false)}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Phone Number ID</label>
                                <input
                                    type="text"
                                    value={whatsappCreds.phone_number_id}
                                    onChange={(e) => setWhatsappCreds({ ...whatsappCreds, phone_number_id: e.target.value })}
                                    className="input-premium"
                                    placeholder="Enter WhatsApp Phone Number ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Business Account ID</label>
                                <input
                                    type="text"
                                    value={whatsappCreds.business_account_id}
                                    onChange={(e) => setWhatsappCreds({ ...whatsappCreds, business_account_id: e.target.value })}
                                    className="input-premium"
                                    placeholder="Enter Business Account ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Access Token</label>
                                <input
                                    type="password"
                                    value={whatsappCreds.access_token}
                                    onChange={(e) => setWhatsappCreds({ ...whatsappCreds, access_token: e.target.value })}
                                    className="input-premium"
                                    placeholder="Enter Access Token"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Verify Token</label>
                                <input
                                    type="text"
                                    value={whatsappCreds.verify_token}
                                    onChange={(e) => setWhatsappCreds({ ...whatsappCreds, verify_token: e.target.value })}
                                    className="input-premium"
                                    placeholder="Enter Verify Token"
                                />
                            </div>
                            <button
                                onClick={handleActivateWhatsApp}
                                disabled={aiLoading}
                                className="w-full btn-premium text-white font-medium py-3 disabled:opacity-50"
                            >
                                {aiLoading ? 'Activating...' : 'Activate AI Assistant'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center"
            >
                <div className="page-header">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                            </div>
                            <span className="text-xs font-medium text-emerald-400">Live</span>
                        </div>
                    </div>
                    <p className="text-slate-400 mt-1">Overview of your store performance</p>
                </div>
                <div className="flex gap-3">
                    <select className="bg-slate-900/80 border border-slate-800 text-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all">
                        <option>Current Month</option>
                    </select>
                </div>
            </motion.div>

            {/* AI Assistant Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -2 }}
                className={cn(
                    "p-6 rounded-2xl border backdrop-blur-xl transition-all relative overflow-hidden group",
                    aiAssistantActive
                        ? "bg-gradient-to-r from-emerald-900/30 to-emerald-900/10 border-emerald-500/30"
                        : "bg-slate-900/50 border-slate-800 hover:border-indigo-500/30"
                )}
            >
                {/* Animated background */}
                {aiAssistantActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 animate-pulse" />
                )}

                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-3 rounded-xl relative",
                            aiAssistantActive
                                ? "bg-gradient-to-br from-emerald-500/20 to-cyan-500/20"
                                : "bg-slate-800"
                        )}>
                            <MessageSquare className={cn(
                                "w-6 h-6",
                                aiAssistantActive ? "text-emerald-400" : "text-slate-400"
                            )} />
                            {aiAssistantActive && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                WhatsApp AI Assistant
                                {aiAssistantActive && <Sparkles className="w-4 h-4 text-emerald-400" />}
                            </h3>
                            <p className="text-sm text-slate-400">
                                {aiAssistantActive
                                    ? "Active - Responding to customer messages automatically"
                                    : "Connect your WhatsApp Business API to enable AI responses"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Connect WhatsApp Button - Facebook Embedded Signup */}
                        {!aiAssistantActive && (
                            <button
                                onClick={launchWhatsAppSignup}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30"
                            >
                                <Link2 className="w-4 h-4" />
                                Connect WhatsApp
                            </button>
                        )}
                        <button
                            onClick={aiAssistantActive ? handleDeactivateWhatsApp : () => setShowCredentialsForm(true)}
                            disabled={aiLoading}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50",
                                aiAssistantActive
                                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                                    : "btn-premium text-white"
                            )}
                        >
                            <Power className="w-4 h-4" />
                            {aiLoading ? 'Processing...' : (aiAssistantActive ? 'Deactivate' : 'Activate')}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(stats.revenue)}
                    change={`${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange.toFixed(1)}%`}
                    trend={stats.revenueChange >= 0 ? 'up' : 'down'}
                    icon={DollarSign}
                    gradient="bg-gradient-to-br from-emerald-500/10 to-transparent"
                    delay={0}
                />
                <StatCard
                    title="Total Orders"
                    value={stats.orders}
                    change={`${stats.ordersChange >= 0 ? '+' : ''}${stats.ordersChange.toFixed(1)}%`}
                    trend={stats.ordersChange >= 0 ? 'up' : 'down'}
                    icon={ShoppingBag}
                    gradient="bg-gradient-to-br from-indigo-500/10 to-transparent"
                    delay={1}
                />
                <StatCard
                    title="Active Products"
                    value={stats.products}
                    change="0%"
                    trend="up"
                    icon={TrendingUp}
                    gradient="bg-gradient-to-br from-purple-500/10 to-transparent"
                    delay={2}
                />
                <StatCard
                    title="Total Customers"
                    value={stats.customers}
                    change={`${stats.customersChange >= 0 ? '+' : ''}${stats.customersChange.toFixed(1)}%`}
                    trend={stats.customersChange >= 0 ? 'up' : 'down'}
                    icon={Users}
                    gradient="bg-gradient-to-br from-cyan-500/10 to-transparent"
                    delay={3}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 glass-card rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Revenue Analytics</h3>
                            <p className="text-sm text-slate-500">Last 7 Days</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-lg">
                            <Activity className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs text-indigo-400 font-medium">Live Data</span>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                        <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                        borderColor: 'rgba(99, 102, 241, 0.3)',
                                        borderRadius: '12px',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card rounded-2xl p-6"
                >
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-400" />
                        Recent Activity
                    </h3>
                    <div className="space-y-5">
                        {recentActivity.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-8">No recent activity</p>
                        ) : (
                            recentActivity.map((order, index) => (
                                <motion.div
                                    key={order.order_id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + index * 0.1 }}
                                    className="flex gap-4 group"
                                >
                                    <div className="relative">
                                        <div className="w-2.5 h-2.5 mt-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shrink-0 group-hover:scale-125 transition-transform" />
                                        {index < recentActivity.length - 1 && (
                                            <div className="absolute top-4 left-1 w-0.5 h-full bg-gradient-to-b from-indigo-500/30 to-transparent" />
                                        )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <p className="text-sm text-slate-300">
                                            New order <span className="text-indigo-400 font-medium">#{order.order_id}</span> received
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-500">{formatTimeAgo(order.created_at)}</span>
                                            <span className="text-xs text-slate-600">•</span>
                                            <span className="text-xs font-medium bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                                {formatCurrency(order.total_amount || order.amount)}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
