import React, { useEffect, useState } from 'react';
import { CreditCard, Wallet, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { database } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { cn } from '../lib/utils';

const StatCard = ({ title, value, icon: Icon, colorClass, gradient, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay * 0.1 }}
        whileHover={{ y: -5, scale: 1.02 }}
        className="stat-card group"
    >
        <div className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl",
            gradient
        )} />
        <div className="relative z-10 flex justify-between items-start mb-4">
            <div className={cn("p-3 rounded-xl", colorClass)}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
        <h3 className="text-slate-400 text-sm font-medium relative z-10">{title}</h3>
        <p className="text-3xl font-bold text-white mt-1 relative z-10 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{value}</p>
    </motion.div>
);

export default function Payments() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        collected: 0,
        pending: 0,
        total: 0
    });

    useEffect(() => {
        // Set up Firebase real-time listener for orders (payment data)
        const sellerIdSafe = 'jilsnshah_at_gmail_dot_com';
        const ordersRef = ref(database, `sellers/${sellerIdSafe}/orders`);

        const unsubscribe = onValue(ordersRef, (snapshot) => {
            const data = snapshot.val();
            // Firebase returns arrays as objects with numeric keys, convert back to array
            const orders = data ? (Array.isArray(data) ? data : Object.values(data)).filter(Boolean) : [];

            const collected = orders
                .filter(o => o.payment_status === 'Completed')
                .reduce((acc, o) => acc + (o.total_amount || 0), 0);

            const pending = orders
                .filter(o => ['Pending', 'Requested', 'Verified'].includes(o.payment_status))
                .reduce((acc, o) => acc + (o.total_amount || 0), 0);

            setStats({
                collected,
                pending,
                total: collected + pending
            });
            setLoading(false);
        }, (error) => {
            console.error("Firebase listener error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-indigo-500/30 rounded-full animate-spin border-t-indigo-500" />
        </div>
    );

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-header"
            >
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Payments</h1>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="relative w-2 h-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                        </div>
                        <span className="text-xs font-medium text-emerald-400">Live</span>
                    </div>
                </div>
                <p className="text-slate-400 mt-1">Track transaction history and settlements</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Revenue Collected"
                    value={formatCurrency(stats.collected)}
                    icon={CheckCircle}
                    colorClass="bg-gradient-to-br from-emerald-500/30 to-teal-500/20"
                    gradient="bg-gradient-to-br from-emerald-500/10 to-transparent"
                    delay={0}
                />
                <StatCard
                    title="Revenue to be Collected"
                    value={formatCurrency(stats.pending)}
                    icon={Clock}
                    colorClass="bg-gradient-to-br from-yellow-500/30 to-amber-500/20"
                    gradient="bg-gradient-to-br from-yellow-500/10 to-transparent"
                    delay={1}
                />
                <StatCard
                    title="Total Revenue Potential"
                    value={formatCurrency(stats.total)}
                    icon={Wallet}
                    colorClass="bg-gradient-to-br from-indigo-500/30 to-purple-500/20"
                    gradient="bg-gradient-to-br from-indigo-500/10 to-transparent"
                    delay={2}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-2xl p-8"
            >
                <h2 className="text-lg font-semibold text-white mb-4">Payment Overview</h2>
                <p className="text-slate-400">
                    Your payment summary is calculated based on order statuses.
                    Mark orders as <strong className="text-indigo-400">Completed</strong> to move them to "Revenue Collected".
                </p>
            </motion.div>
        </div>
    );
}
