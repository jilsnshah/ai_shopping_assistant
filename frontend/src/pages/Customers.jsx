import React, { useEffect, useState } from 'react';
import { User, Phone, ShoppingBag, Calendar, X, Clock, CheckCircle, Truck, XCircle, MessageCircle, Send, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/useToast';
import { database } from '../firebase/config';
import { ref, onValue, off } from 'firebase/database';

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'conversation'
    const [conversation, setConversation] = useState([]);
    const [loadingConversation, setLoadingConversation] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const { success, error } = useToast();

    useEffect(() => {
        // Set up Firebase real-time listeners for customer IDs, buyers, and orders
        const sellerIdSafe = 'jilsnshah_at_gmail_dot_com';
        const customerIdsRef = ref(database, `sellers/${sellerIdSafe}/customers`);
        const ordersRef = ref(database, `sellers/${sellerIdSafe}/orders`);
        const buyersRef = ref(database, 'buyers');

        let customerIds = [];
        let ordersData = [];
        let buyersData = {};

        const processCustomerData = () => {
            if (!customerIds || customerIds.length === 0) {
                setCustomers([]);
                setLoading(false);
                return;
            }

            const customerList = customerIds.map(phone => {
                // Convert phone to string for comparison
                const phoneStr = String(phone);

                // Get buyer info from buyers collection
                const buyerInfo = buyersData[phoneStr] || {};

                const customerOrders = ordersData.filter(order => String(order.buyer_phone) === phoneStr);

                // Get name from buyers collection first, then orders, then use phone
                const name = buyerInfo.name || (customerOrders.length > 0 ? customerOrders[0].buyer_name : null) || phoneStr;

                return {
                    phone: phoneStr,
                    name: name,
                    totalOrders: customerOrders.length,
                    totalSpent: customerOrders.reduce((sum, order) => sum + (order.total_amount || order.amount || 0), 0),
                    lastOrderDate: customerOrders.length > 0
                        ? customerOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at
                        : null,
                    orders: customerOrders
                };
            }).sort((a, b) => {
                if (!a.lastOrderDate) return 1;
                if (!b.lastOrderDate) return -1;
                return new Date(b.lastOrderDate) - new Date(a.lastOrderDate);
            });

            console.log('Processed customer list:', customerList);
            setCustomers(customerList);
            setLoading(false);
        };

        const unsubscribeCustomerIds = onValue(customerIdsRef, (snapshot) => {
            customerIds = snapshot.val() || [];
            console.log('Customer IDs received:', customerIds);
            processCustomerData();
        });

        const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
            const data = snapshot.val();
            ordersData = data ? (Array.isArray(data) ? data : Object.values(data)).filter(Boolean) : [];
            console.log('Orders received:', ordersData.length);
            processCustomerData();
        });

        const unsubscribeBuyers = onValue(buyersRef, (snapshot) => {
            buyersData = snapshot.val() || {};
            console.log('Buyers data received:', Object.keys(buyersData).length);
            processCustomerData();
        });

        return () => {
            unsubscribeCustomerIds();
            unsubscribeOrders();
            unsubscribeBuyers();
        };
    }, []);

    // Set up Firebase real-time listener for conversation
    useEffect(() => {
        if (!selectedCustomer || activeTab !== 'conversation') return;

        setLoadingConversation(true);

        // Create reference to conversation path
        const sellerIdSafe = 'jilsnshah_at_gmail_dot_com';
        const phoneStr = String(selectedCustomer.phone || '');
        const buyerPhoneSafe = phoneStr.replace(/[.#$/\\[\\]]/g, '_');
        const conversationRef = ref(database, `sellers/${sellerIdSafe}/conv_history/${buyerPhoneSafe}`);

        // Set up real-time listener
        const unsubscribe = onValue(conversationRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Convert Firebase object to array and sort by timestamp
                const messages = Object.values(data)
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map(msg => ({
                        role: msg.role,
                        content: msg.content,
                        timestamp: msg.timestamp
                    }));
                setConversation(messages);
            } else {
                setConversation([]);
            }
            setLoadingConversation(false);
        }, (error) => {
            console.error("Firebase listener error:", error);
            setLoadingConversation(false);
        });

        // Cleanup listener on unmount or when dependencies change
        return () => {
            unsubscribe();
        };
    }, [selectedCustomer, activeTab]);

    // Auto-scroll to bottom when conversation updates
    useEffect(() => {
        if (conversation.length > 0) {
            const messagesContainer = document.getElementById('messages-container');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    }, [conversation]);

    const fetchConversation = async () => {
        if (!selectedCustomer) return;

        setLoadingConversation(true);
        try {
            const res = await api.get(`/customers/${selectedCustomer.phone}/conversation`);
            setConversation(res.data.conversation || []);
        } catch (err) {
            console.error("Failed to fetch conversation", err);
            error('Failed to load conversation');
        } finally {
            setLoadingConversation(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedCustomer) return;

        setSending(true);
        try {
            await api.post(`/customers/${selectedCustomer.phone}/send-message`, {
                message: newMessage
            });

            success('Message sent successfully');
            setNewMessage('');

            // Refresh conversation
            await fetchConversation();
        } catch (err) {
            console.error("Failed to send message", err);
            error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            'Received': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            'Ready to Deliver': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            'To Deliver': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
            'Delivered': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            'Cancelled': 'bg-red-500/10 text-red-500 border-red-500/20',
        };
        return (
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", styles[status] || styles['Received'])}>
                {status || 'Received'}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Customers</h1>
                <p className="text-slate-400 mt-1">Overview of your customer base</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="text-white">Loading customers...</div>
                ) : customers.map((customer) => (
                    <div
                        key={customer.phone}
                        onClick={() => { setSelectedCustomer(customer); setActiveTab('conversation'); }}
                        className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 group hover:border-indigo-500/30 transition-all cursor-pointer hover:bg-slate-800/50"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">{customer.name}</h3>
                                <p className="text-sm text-slate-500">{customer.phone}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                                <span className="text-slate-400 text-sm flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4" /> Orders
                                </span>
                                <span className="text-white font-medium">{customer.totalOrders}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                                <span className="text-slate-400 text-sm flex items-center gap-2">
                                    <User className="w-4 h-4" /> Lifetime Value
                                </span>
                                <span className="text-white font-medium">₹{customer.totalSpent.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-slate-400 text-sm flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Last Order
                                </span>
                                <span className="text-white font-medium text-sm">
                                    {new Date(customer.lastOrderDate).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Customer Details Modal */}
            <AnimatePresence>
                {selectedCustomer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{selectedCustomer.name}</h2>
                                        <p className="text-slate-400 text-sm">{selectedCustomer.phone}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedCustomer(null)}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-slate-800 bg-slate-900/30">
                                <button
                                    onClick={() => setActiveTab('conversation')}
                                    className={cn(
                                        "px-6 py-3 font-medium transition-all flex items-center gap-2",
                                        activeTab === 'conversation'
                                            ? "text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5"
                                            : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Conversation
                                </button>
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className={cn(
                                        "px-6 py-3 font-medium transition-all flex items-center gap-2",
                                        activeTab === 'orders'
                                            ? "text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5"
                                            : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    Orders
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-hidden">
                                {activeTab === 'orders' ? (
                                    <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar">
                                        <h3 className="text-lg font-semibold text-white mb-4">Order History</h3>
                                        <div className="space-y-4">
                                            {selectedCustomer.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((order) => (
                                                <div key={order.order_id} className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="text-indigo-400 font-mono font-medium">#{order.order_id}</span>
                                                            <span className="text-slate-500 text-sm">
                                                                {new Date(order.created_at).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-300 text-sm line-clamp-1">
                                                            {order.items?.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                                        <div className="text-right">
                                                            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Total</p>
                                                            <p className="text-white font-bold">₹{(order.total_amount || order.amount).toLocaleString()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Status</p>
                                                            <StatusBadge status={order.order_status} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-[400px]">
                                        {/* Messages Header with Refresh */}
                                        <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800/50">
                                            <span className="text-xs text-slate-500 flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                Real-time updates
                                            </span>
                                            <button
                                                onClick={() => fetchConversation()}
                                                disabled={loadingConversation}
                                                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                                                title="Refresh conversation"
                                            >
                                                <RefreshCw className={cn("w-4 h-4", loadingConversation && "animate-spin")} />
                                            </button>
                                        </div>

                                        {/* Messages */}
                                        <div id="messages-container" className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-950/30">
                                            {loadingConversation ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <div className="text-slate-400">Loading conversation...</div>
                                                </div>
                                            ) : conversation.length === 0 ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <div className="text-center text-slate-500">
                                                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                        <p>No conversation history yet</p>
                                                        <p className="text-sm mt-1">Send a message to start the conversation</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {conversation.map((msg, index) => {
                                                        // Check if this is the first message from this sender or if sender changed
                                                        const showSenderLabel = index === 0 ||
                                                            conversation[index - 1].role !== msg.role;

                                                        // Format timestamp
                                                        const messageTime = msg.timestamp
                                                            ? new Date(msg.timestamp).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })
                                                            : '';

                                                        return (
                                                            <div key={index} className={cn(
                                                                "flex flex-col",
                                                                msg.role === 'assistant' ? "items-end" : "items-start"
                                                            )}>
                                                                {/* Sender Label */}
                                                                {showSenderLabel && (
                                                                    <div className={cn(
                                                                        "text-xs font-medium mb-1 px-1",
                                                                        msg.role === 'assistant'
                                                                            ? "text-indigo-400"
                                                                            : "text-slate-400"
                                                                    )}>
                                                                        {msg.role === 'assistant' ? 'YOU' : selectedCustomer.name}
                                                                    </div>
                                                                )}

                                                                {/* Message Bubble */}
                                                                <div className={cn(
                                                                    "max-w-[70%] rounded-2xl px-4 py-2",
                                                                    msg.role === 'assistant'
                                                                        ? "bg-indigo-600 text-white rounded-br-sm"
                                                                        : "bg-slate-800 text-slate-100 rounded-bl-sm"
                                                                )}>
                                                                    <p className="text-sm whitespace-pre-wrap mb-1">{msg.content}</p>

                                                                    {/* Timestamp */}
                                                                    {messageTime && (
                                                                        <div className={cn(
                                                                            "text-[10px] text-right mt-1",
                                                                            msg.role === 'assistant'
                                                                                ? "text-indigo-200"
                                                                                : "text-slate-500"
                                                                        )}>
                                                                            {messageTime}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Message Input */}
                                        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                                                    placeholder="Type a message..."
                                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    disabled={sending}
                                                />
                                                <button
                                                    onClick={handleSendMessage}
                                                    disabled={!newMessage.trim() || sending}
                                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 font-medium transition-colors flex items-center gap-2"
                                                >
                                                    {sending ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <Send className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
