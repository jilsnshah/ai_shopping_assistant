import React, { useEffect, useState } from 'react';
import { CreditCard, Wallet, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { database } from '../firebase/config';
import { ref, onValue } from 'firebase/database';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl relative overflow-hidden group"
    >
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${colorClass}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
        <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
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

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-white">Payments</h1>
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-emerald-400">Live</span>
                    </div>
                </div>
                <p className="text-slate-400 mt-1">Track transaction history and settlements</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Revenue Collected"
                    value={formatCurrency(stats.collected)}
                    icon={CheckCircle}
                    colorClass="bg-emerald-500/20 text-emerald-500"
                />
                <StatCard
                    title="Revenue to be Collected"
                    value={formatCurrency(stats.pending)}
                    icon={Clock}
                    colorClass="bg-yellow-500/20 text-yellow-500"
                />
                <StatCard
                    title="Total Revenue Potential"
                    value={formatCurrency(stats.total)}
                    icon={Wallet}
                    colorClass="bg-indigo-500/20 text-indigo-500"
                />
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">
                <h2 className="text-lg font-semibold text-white mb-4">Payment Overview</h2>
                <p className="text-slate-400">
                    Your payment summary is calculated based on order statuses.
                    Mark orders as <strong>Completed</strong> to move them to "Revenue Collected".
                </p>
            </div>
        </div>
    );
}
