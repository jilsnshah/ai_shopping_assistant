import React, { useEffect, useState } from 'react';
import { Search, Filter, ChevronDown, CheckCircle, Clock, Truck, XCircle, MoreHorizontal, CreditCard, Loader2, MapPin, X, Package, Calendar, User } from 'lucide-react';
import api from '../api/axios';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { database } from '../firebase/config';
import { ref, onValue } from 'firebase/database';

const StatusBadge = ({ status }) => {
    const styles = {
        'Received': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        'Ready to Deliver': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        'To Deliver': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
        'Delivered': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        'Cancelled': 'bg-red-500/10 text-red-500 border-red-500/20',
    };

    const icons = {
        'Received': Clock,
        'Ready to Deliver': CheckCircle,
        'To Deliver': Truck,
        'Delivered': CheckCircle,
        'Cancelled': XCircle
    };

    const Icon = icons[status] || Clock;

    return (
        <span className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border", styles[status] || styles['Pending'])}>
            <Icon className="w-3 h-3" />
            {status}
        </span>
    );
};

const PaymentBadge = ({ status }) => {
    const styles = {
        'Pending': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        'Requested': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        'Completed': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        'Verified': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    };

    const icons = {
        'Pending': Clock,
        'Requested': CreditCard,
        'Completed': CheckCircle,
        'Verified': CheckCircle
    };

    const Icon = icons[status] || Clock;

    return (
        <span className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border", styles[status] || styles['Pending'])}>
            <Icon className="w-3 h-3" />
            {status}
        </span>
    );
};

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [paymentFilter, setPaymentFilter] = useState('All');
    const [sortBy, setSortBy] = useState('newest'); // newest, oldest, highest, lowest
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showPaymentFilterMenu, setShowPaymentFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [upiId, setUpiId] = useState('');
    const [razorpayEnabled, setRazorpayEnabled] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null); // For order detail modal
    const { toasts, removeToast, success, error } = useToast();

    // Message Modal State
    const [messageModal, setMessageModal] = useState({
        isOpen: false,
        orderId: null,
        type: null, // 'status' or 'payment'
        newStatus: null,
        message: '',
        invoiceFile: null // PDF invoice file
    });

    const ORDER_STATUSES = ['Received', 'Ready to Deliver', 'To Deliver', 'Delivered', 'Cancelled'];
    const PAYMENT_STATUSES = ['Pending', 'Requested', 'Completed'];

    useEffect(() => {
        // Set up Firebase real-time listener for orders
        const sellerIdSafe = 'jilsnshah_at_gmail_dot_com';
        const ordersRef = ref(database, `sellers/${sellerIdSafe}/orders`);

        const unsubscribe = onValue(ordersRef, (snapshot) => {
            const data = snapshot.val();
            // Firebase returns arrays as objects with numeric keys, convert back to array
            if (data) {
                const ordersArray = Array.isArray(data) ? data : Object.values(data);
                setOrders(ordersArray.filter(Boolean)); // Remove any null/undefined entries
            } else {
                setOrders([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Firebase listener error:", error);
            setLoading(false);
        });

        fetchCompanyInfo();
        fetchRazorpayStatus();

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        filterAndSortOrders();
    }, [statusFilter, paymentFilter, sortBy, orders]);

    const filterAndSortOrders = () => {
        let result = orders;

        // Apply filters
        if (statusFilter !== 'All') {
            result = result.filter(order => order.order_status === statusFilter);
        }
        if (paymentFilter !== 'All') {
            result = result.filter(order => order.payment_status === paymentFilter);
        }

        // Apply sorting
        result = [...result].sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'oldest':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'highest':
                    return (b.total_amount || b.amount || 0) - (a.total_amount || a.amount || 0);
                case 'lowest':
                    return (a.total_amount || a.amount || 0) - (b.total_amount || b.amount || 0);
                default:
                    return 0;
            }
        });

        setFilteredOrders(result);
    };

    const fetchCompanyInfo = async () => {
        try {
            const res = await api.get('/company');
            setUpiId(res.data.upi_id || '');
        } catch (error) {
            console.error("Failed to fetch company info", error);
        }
    };

    const fetchRazorpayStatus = async () => {
        try {
            const res = await api.get('/razorpay/status');
            setRazorpayEnabled(res.data.connected && res.data.enabled);
        } catch (error) {
            console.error("Failed to fetch Razorpay status", error);
        }
    };

    const filterOrders = () => {
        let result = orders;
        if (statusFilter !== 'All') {
            result = result.filter(order => order.order_status === statusFilter);
        }
        if (paymentFilter !== 'All') {
            result = result.filter(order => order.payment_status === paymentFilter);
        }
        setFilteredOrders(result);
    };

    const generateMessage = (order, type, newStatus) => {
        const items = order.items || [];
        let itemsDisplay = "";

        if (items.length > 0) {
            if (items.length === 1) {
                itemsDisplay = `${items[0].product_name} x${items[0].quantity}`;
            } else {
                itemsDisplay = items.map(i => `- ${i.product_name} x${i.quantity}`).join('\n');
            }
        } else {
            itemsDisplay = order.product_name || 'your order';
        }

        const totalAmount = order.total_amount || order.amount || 0;

        if (type === 'status') {
            return `🛒 *Order Status Update* 🛒

Order ID: #${order.order_id}
Items:
${itemsDisplay}

Status: *${newStatus}*

Thank you for your order!`;
        } else if (type === 'payment') {
            if (newStatus === 'Requested') {
                if (razorpayEnabled) {
                    return `💳 *Payment Request* 💳

Order ID: #${order.order_id}
Items:
${itemsDisplay}
Amount: *₹${totalAmount.toFixed(2)}*

Please complete your payment using this secure link:
🔗 [Payment link will be generated automatically]

After payment, your order will be automatically confirmed.

Thank you! 🙏`;
                } else if (upiId) {
                    return `💳 *Payment Request* 💳

Order ID: #${order.order_id}
Items:
${itemsDisplay}
Amount: *₹${totalAmount.toFixed(2)}*

Please pay to UPI ID:
📱 *${upiId}*

After payment, please share the transaction screenshot for verification.

Thank you! 🙏`;
                } else {
                    return `💳 *Payment Request* 💳

Order ID: #${order.order_id}
Items:
${itemsDisplay}
Amount: *₹${totalAmount.toFixed(2)}*

Please contact the seller for payment details.

Thank you! 🙏`;
                }
            } else if (newStatus === 'Completed') {
                return `✅ *Payment Confirmed* ✅

Order ID: #${order.order_id}
Items:
${itemsDisplay}
Amount: ₹${totalAmount.toFixed(2)}

Your payment has been received and confirmed!
Your order will be processed shortly.

Thank you for your purchase! 🎉`;
            } else if (newStatus === 'Pending') {
                return `⏳ *Payment Status Update* ⏳

Order ID: #${order.order_id}
Items:
${itemsDisplay}
Amount: ₹${totalAmount.toFixed(2)}

Payment status: *Pending*

We'll notify you once payment is requested.

Thank you! 🙏`;
            }
        }
        return '';
    };

    const initiateStatusUpdate = (orderId, newStatus) => {
        const order = orders.find(o => o.order_id === orderId);
        const message = generateMessage(order, 'status', newStatus);
        setMessageModal({
            isOpen: true,
            orderId,
            type: 'status',
            newStatus,
            message
        });
    };

    const initiatePaymentStatusUpdate = (orderId, newStatus) => {
        const order = orders.find(o => o.order_id === orderId);
        const message = generateMessage(order, 'payment', newStatus);
        setMessageModal({
            isOpen: true,
            orderId,
            type: 'payment',
            newStatus,
            message,
            invoiceFile: null
        });
    };

    const confirmUpdate = async () => {
        const { orderId, type, newStatus, message, invoiceFile } = messageModal;

        // Debug: Log what we have
        console.log('📄 DEBUG: invoiceFile =', invoiceFile);
        console.log('📄 DEBUG: type =', type);
        console.log('📄 DEBUG: newStatus =', newStatus);
        console.log('📄 DEBUG: messageModal =', messageModal);

        setIsSending(true);
        try {
            // Use FormData to support file upload
            const formData = new FormData();

            // Only send custom_message if:
            // 1. It's not a payment request, OR
            // 2. It's a payment request but Razorpay is NOT enabled
            // This allows backend to generate actual Razorpay link when needed
            const shouldSendCustomMessage = type !== 'payment' ||
                newStatus !== 'Requested' ||
                !razorpayEnabled;

            if (shouldSendCustomMessage) {
                formData.append('custom_message', message);
            }

            if (type === 'status') {
                formData.append('order_status', newStatus);
            } else {
                formData.append('payment_status', newStatus);

                // Attach invoice file if present and status is Requested
                if (invoiceFile && newStatus === 'Requested') {
                    formData.append('invoice', invoiceFile);
                }
            }

            // When sending FormData with file, don't set Content-Type - let browser handle it
            await api.put(`/orders/${orderId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Update local state
            const payload = type === 'status' ? { order_status: newStatus } : { payment_status: newStatus };
            setOrders(orders.map(o => {
                if (o.order_id === orderId) {
                    return { ...o, ...payload };
                }
                return o;
            }));

            setMessageModal({ ...messageModal, isOpen: false });
            success('Notification sent successfully! 🎉');
        } catch (err) {
            console.error("Failed to update order", err);
            error('Failed to send notification. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-8">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            {/* Header and Filters can remain same */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white">Orders</h1>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-emerald-400">Live</span>
                        </div>
                    </div>
                    <p className="text-slate-400 mt-1">Manage and track customer orders</p>
                </div>

                <div className="flex gap-3 z-20">
                    {/* Sort Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                            </svg>
                            Sort: {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : sortBy === 'highest' ? 'Highest Amount' : 'Lowest Amount'}
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {showSortMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)}></div>
                                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                                    <button
                                        onClick={() => {
                                            setSortBy('newest');
                                            setShowSortMenu(false);
                                        }}
                                        className={cn(
                                            "block w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors",
                                            sortBy === 'newest' ? "text-indigo-400 bg-indigo-500/10" : "text-slate-300"
                                        )}
                                    >
                                        Newest First
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSortBy('oldest');
                                            setShowSortMenu(false);
                                        }}
                                        className={cn(
                                            "block w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors",
                                            sortBy === 'oldest' ? "text-indigo-400 bg-indigo-500/10" : "text-slate-300"
                                        )}
                                    >
                                        Oldest First
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSortBy('highest');
                                            setShowSortMenu(false);
                                        }}
                                        className={cn(
                                            "block w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors",
                                            sortBy === 'highest' ? "text-indigo-400 bg-indigo-500/10" : "text-slate-300"
                                        )}
                                    >
                                        Highest Amount
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSortBy('lowest');
                                            setShowSortMenu(false);
                                        }}
                                        className={cn(
                                            "block w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors",
                                            sortBy === 'lowest' ? "text-indigo-400 bg-indigo-500/10" : "text-slate-300"
                                        )}
                                    >
                                        Lowest Amount
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors",
                                statusFilter !== 'All' && "bg-indigo-500/10 text-indigo-400"
                            )}
                        >
                            <Filter className="w-4 h-4" />
                            {statusFilter === 'All' ? 'Order Status' : statusFilter}
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {showFilterMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)}></div>
                                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden max-h-64 overflow-y-auto">
                                    <button
                                        onClick={() => {
                                            setStatusFilter('All');
                                            setShowFilterMenu(false);
                                        }}
                                        className={cn(
                                            "block w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors",
                                            statusFilter === 'All' ? "text-indigo-400 bg-indigo-500/10" : "text-slate-300"
                                        )}
                                    >
                                        All
                                    </button>
                                    {ORDER_STATUSES.map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setStatusFilter(status);
                                                setShowFilterMenu(false);
                                            }}
                                            className={cn(
                                                "block w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors",
                                                statusFilter === status ? "text-indigo-400 bg-indigo-500/10" : "text-slate-300"
                                            )}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Payment Status Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setShowPaymentFilterMenu(!showPaymentFilterMenu)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors",
                                paymentFilter !== 'All' && "bg-emerald-500/10 text-emerald-400"
                            )}
                        >
                            <CreditCard className="w-4 h-4" />
                            {paymentFilter === 'All' ? 'Payment Status' : paymentFilter}
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {showPaymentFilterMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowPaymentFilterMenu(false)}></div>
                                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden max-h-64 overflow-y-auto">
                                    <button
                                        onClick={() => {
                                            setPaymentFilter('All');
                                            setShowPaymentFilterMenu(false);
                                        }}
                                        className={cn(
                                            "block w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors",
                                            paymentFilter === 'All' ? "text-emerald-400 bg-emerald-500/10" : "text-slate-300"
                                        )}
                                    >
                                        All Payments
                                    </button>
                                    {PAYMENT_STATUSES.map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setPaymentFilter(status);
                                                setShowPaymentFilterMenu(false);
                                            }}
                                            className={cn(
                                                "block w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors",
                                                paymentFilter === status ? "text-emerald-400 bg-emerald-500/10" : "text-slate-300"
                                            )}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-sm">
                            <th className="px-6 py-4 font-medium">Order ID</th>
                            <th className="px-6 py-4 font-medium">Customer</th>
                            <th className="px-6 py-4 font-medium">Items</th>
                            <th className="px-6 py-4 font-medium">Total</th>
                            <th className="px-6 py-4 font-medium">Payment</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Date</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="8" className="p-8 text-center text-slate-500">Loading...</td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan="8" className="p-8 text-center text-slate-500">No orders found.</td></tr>
                        ) : filteredOrders.map((order) => (
                            <tr
                                key={order.order_id}
                                className="group hover:bg-slate-800/30 transition-colors cursor-pointer"
                                onClick={() => setSelectedOrder(order)}
                            >
                                <td className="px-6 py-4 font-mono text-indigo-400">#{order.order_id}</td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-white">{order.buyer_phone}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-300">
                                    {order.items ? (
                                        <div className="flex flex-col gap-1">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="text-sm">
                                                    <span>{item.product_name} <span className="text-slate-500">x{item.quantity}</span></span>
                                                    {item.selected_features && Object.keys(item.selected_features).length > 0 && (
                                                        <span className="ml-2 text-xs text-indigo-400">
                                                            ({Object.entries(item.selected_features).map(([k, v]) => `${k}: ${v}`).join(', ')})
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span>{order.product_name}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-medium text-white">₹{order.total_amount || order.amount}</td>
                                <td className="px-6 py-4">
                                    <PaymentBadge status={order.payment_status} />
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={order.order_status} />
                                </td>
                                <td className="px-6 py-4 text-slate-400 text-sm">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="relative inline-block text-left group/actions">
                                        <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                        <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible transition-all z-10">
                                            <div className="px-2 py-2 space-y-1">
                                                <div className="px-2 pb-1 text-xs font-semibold text-slate-500 uppercase">Order Status</div>
                                                {ORDER_STATUSES.map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => initiateStatusUpdate(order.order_id, status)}
                                                        disabled={order.order_status === status}
                                                        className={cn(
                                                            "block w-full text-left px-4 py-1.5 text-sm rounded-lg",
                                                            order.order_status === status
                                                                ? "bg-indigo-500/10 text-indigo-400"
                                                                : "text-slate-300 hover:bg-slate-800"
                                                        )}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                                <div className="border-t border-slate-800 pt-2">
                                                    <div className="px-2 pb-1 text-xs font-semibold text-slate-500 uppercase">Payment Status</div>
                                                    {PAYMENT_STATUSES.map((status) => (
                                                        <button
                                                            key={status}
                                                            onClick={() => initiatePaymentStatusUpdate(order.order_id, status)}
                                                            disabled={order.payment_status === status}
                                                            className={cn(
                                                                "block w-full text-left px-4 py-1.5 text-sm rounded-lg",
                                                                order.payment_status === status
                                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                                    : "text-slate-300 hover:bg-slate-800"
                                                            )}
                                                        >
                                                            {status}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Message Preview Modal */}
            <AnimatePresence>
                {messageModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl"
                        >
                            <div className="p-6 border-b border-slate-800">
                                <h2 className="text-xl font-bold text-white">Review Notification</h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    Review and edit the message that will be sent to the customer via WhatsApp.
                                </p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        Message Content
                                    </label>
                                    <textarea
                                        value={messageModal.message}
                                        onChange={(e) => setMessageModal({ ...messageModal, message: e.target.value })}
                                        rows={12}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    />
                                </div>

                                {/* Invoice Upload (only for Payment Requested) */}
                                {messageModal.type === 'payment' && messageModal.newStatus === 'Requested' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">
                                            Attach Invoice (Optional)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        // Validate file size (max 5MB)
                                                        if (file.size > 5 * 1024 * 1024) {
                                                            alert('File size must be less than 5MB');
                                                            e.target.value = '';
                                                            return;
                                                        }
                                                        setMessageModal({ ...messageModal, invoiceFile: file });
                                                    }
                                                }}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                                            />
                                            {messageModal.invoiceFile && (
                                                <div className="mt-2 flex items-center gap-2 text-sm text-emerald-400">
                                                    <CheckCircle className="w-4 h-4" />
                                                    {messageModal.invoiceFile.name} ({(messageModal.invoiceFile.size / 1024).toFixed(2)} KB)
                                                    <button
                                                        onClick={() => setMessageModal({ ...messageModal, invoiceFile: null })}
                                                        className="ml-auto text-red-400 hover:text-red-300"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">PDF only, max 5MB</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50 rounded-b-2xl">
                                <button
                                    onClick={() => setMessageModal({ ...messageModal, isOpen: false })}
                                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmUpdate}
                                    disabled={isSending}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Confirm & Send
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Order Detail Modal */}
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="relative p-6 border-b border-slate-700/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
                                <div className="relative flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                                <Package className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-white">Order #{selectedOrder.order_id}</h2>
                                                <p className="text-slate-400 text-sm flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(selectedOrder.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <StatusBadge status={selectedOrder.order_status} />
                                    <PaymentBadge status={selectedOrder.payment_status} />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] custom-scrollbar space-y-6">
                                {/* Customer Info */}
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Customer
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{selectedOrder.buyer_name || 'Customer'}</p>
                                            <p className="text-slate-400 text-sm">{selectedOrder.buyer_phone}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Package className="w-4 h-4" /> Order Items
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedOrder.items ? selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                                                <div className="flex-1">
                                                    <p className="text-white font-medium">{item.product_name}</p>
                                                    <p className="text-slate-500 text-sm">Qty: {item.quantity} × ₹{item.price}</p>
                                                    {item.selected_features && Object.keys(item.selected_features).length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {Object.entries(item.selected_features).map(([key, value]) => (
                                                                <span key={key} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-lg border border-indigo-500/20">
                                                                    {key}: {value}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-emerald-400 font-semibold">₹{item.subtotal}</p>
                                            </div>
                                        )) : (
                                            <div className="p-3 bg-slate-900/50 rounded-lg">
                                                <p className="text-white">{selectedOrder.product_name}</p>
                                                <p className="text-slate-500 text-sm">Qty: {selectedOrder.quantity}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                                        <span className="text-slate-400 font-medium">Total Amount</span>
                                        <span className="text-2xl font-bold text-white">₹{(selectedOrder.total_amount || selectedOrder.amount || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Delivery Address */}
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Delivery Address
                                    </h3>
                                    <p className="text-white">{selectedOrder.delivery_address || 'Not provided'}</p>
                                    {selectedOrder.delivery_lat && selectedOrder.delivery_lng && (
                                        <a
                                            href={`https://www.google.com/maps?q=${selectedOrder.delivery_lat},${selectedOrder.delivery_lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors text-sm"
                                        >
                                            <MapPin className="w-4 h-4" />
                                            View on Map
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 flex justify-end">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="px-6 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
