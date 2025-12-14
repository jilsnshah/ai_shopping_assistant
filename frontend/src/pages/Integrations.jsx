import React, { useState, useEffect } from 'react';
import { Package, FileText, CreditCard, Settings, CheckCircle2, Plus, Check } from 'lucide-react';
import api from '../api/axios';

export default function Integrations() {
    const [deliveryMode, setDeliveryMode] = useState('manual');
    const [invoiceMode, setInvoiceMode] = useState('manual');
    const [paymentMode, setPaymentMode] = useState('manual');
    const [razorpayConnected, setRazorpayConnected] = useState(false);
    const [showRazorpayForm, setShowRazorpayForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        api_key: '',
        api_secret: ''
    });

    useEffect(() => {
        fetchRazorpayStatus();
    }, []);

    const fetchRazorpayStatus = async () => {
        try {
            const response = await api.get('/razorpay/status');
            if (response.data.connected) {
                setRazorpayConnected(true);
                setPaymentMode('razorpay');
            }
        } catch (error) {
            console.error('Failed to fetch Razorpay status:', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSaveRazorpay = async () => {
        if (!formData.api_key || !formData.api_secret) {
            alert('Please enter both API key and secret');
            return;
        }

        setLoading(true);
        try {
            await api.post('/razorpay/credentials', formData);
            setRazorpayConnected(true);
            setPaymentMode('razorpay');
            setShowRazorpayForm(false);
            setFormData({ api_key: '', api_secret: '' });
        } catch (error) {
            console.error('Failed to save Razorpay credentials:', error);
            alert('Failed to save credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnectRazorpay = async () => {
        if (!confirm('Are you sure you want to disconnect Razorpay? You can reconnect anytime.')) {
            return;
        }

        setLoading(true);
        try {
            await api.post('/razorpay/disconnect');
            setRazorpayConnected(false);
            setPaymentMode('manual');
        } catch (error) {
            console.error('Failed to disconnect Razorpay:', error);
            alert('Failed to disconnect. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const IntegrationCard = ({
        title,
        description,
        icon: Icon,
        mode,
        showConnectOption = false,
        onConnect,
        connected = false
    }) => (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                    <Icon className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
                    <p className="text-sm text-slate-400 mb-4">{description}</p>

                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-sm text-slate-400">Current Mode:</span>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                            <CheckCircle2 className={`w-4 h-4 ${connected ? 'text-green-400' : 'text-slate-500'}`} />
                            <span className="text-sm font-medium text-white capitalize">
                                {connected ? mode : 'Manual'}
                            </span>
                        </div>
                    </div>

                    {showConnectOption && !connected && (
                        <button
                            onClick={onConnect}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Connect Razorpay
                        </button>
                    )}

                    {showConnectOption && connected && (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                            <Check className="w-4 h-4" />
                            <span>Razorpay Connected</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const RazorpayConnectForm = () => (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                        <CreditCard className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Connect Razorpay</h2>
                        <p className="text-sm text-slate-400">Enter your Razorpay credentials</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            API Key ID
                        </label>
                        <input
                            type="text"
                            name="api_key"
                            value={formData.api_key}
                            onChange={handleInputChange}
                            placeholder="rzp_test_xxxxxxxxxxxxx"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            API Key Secret
                        </label>
                        <input
                            type="password"
                            name="api_secret"
                            value={formData.api_secret}
                            onChange={handleInputChange}
                            placeholder="Enter your secret key"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />
                    </div>

                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                        <p className="text-xs text-indigo-300">
                            💡 You can find your API credentials in the Razorpay Dashboard under Settings → API Keys
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={() => {
                            setShowRazorpayForm(false);
                            setFormData({ api_key: '', api_secret: '' });
                        }}
                        disabled={loading}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveRazorpay}
                        disabled={loading}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                        {loading ? 'Connecting...' : 'Connect'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Integrations</h1>
                <p className="text-slate-400 mt-1">Manage your delivery, invoicing, and payment integrations</p>
            </div>

            <div className="space-y-6">
                <IntegrationCard
                    title="Delivery Management"
                    description="Configure how you handle order deliveries and shipments"
                    icon={Package}
                    mode={deliveryMode}
                />

                <IntegrationCard
                    title="Invoice Generation"
                    description="Set up automatic invoice generation and management"
                    icon={FileText}
                    mode={invoiceMode}
                />

                <IntegrationCard
                    title="Payment Gateway"
                    description="Connect payment gateways to accept online payments"
                    icon={CreditCard}
                    mode={paymentMode}
                    showConnectOption={true}
                    connected={razorpayConnected}
                    onConnect={() => setShowRazorpayForm(true)}
                />
            </div>

            {showRazorpayForm && <RazorpayConnectForm />}
        </div>
    );
}
