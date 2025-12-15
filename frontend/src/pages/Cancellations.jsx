import React, { useState, useEffect } from 'react';
import { XCircle, CheckCircle, AlertCircle, MessageSquare, DollarSign, Package, User, Calendar } from 'lucide-react';
import api from '../api/axios';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';

export default function Cancellations() {
    const [cancellationRequests, setCancellationRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [customMessage, setCustomMessage] = useState('');
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
    const { toasts, removeToast, success, error } = useToast();

    useEffect(() => {
        fetchCancellationRequests();
    }, []);

    const fetchCancellationRequests = async () => {
        try {
            const res = await api.get('/cancellations');
            setCancellationRequests(res.data.cancellations || []);
        } catch (err) {
            console.error("Failed to fetch cancellation requests", err);
            error('Failed to load cancellation requests');
        } finally {
            setLoading(false);
        }
    };

    const openMessageModal = (request, type) => {
        setSelectedRequest(request);
        setActionType(type);

        // Set default message
        if (type === 'approve') {
            setCustomMessage(
                `Your cancellation request for Order #${request.order_id} has been approved. ` +
                (request.payment_status === 'Completed'
                    ? `Refund of ₹${request.total_amount} will be processed within 5-7 business days.`
                    : 'Your order has been cancelled successfully.')
            );
        } else {
            setCustomMessage(
                `Your cancellation request for Order #${request.order_id} has been rejected. ` +
                `Please contact us for more information.`
            );
        }

        setShowMessageModal(true);
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;

        setProcessingId(selectedRequest.order_id);
        try {
            await api.post(`/cancellations/${selectedRequest.order_id}/approve`, {
                message: customMessage
            });

            success('Cancellation approved and order deleted');
            setShowMessageModal(false);
            setSelectedRequest(null);
            setCustomMessage('');
            fetchCancellationRequests(); // Refresh list
        } catch (err) {
            console.error("Failed to approve cancellation", err);
            error('Failed to approve cancellation');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;

        setProcessingId(selectedRequest.order_id);
        try {
            await api.post(`/cancellations/${selectedRequest.order_id}/reject`, {
                message: customMessage
            });

            success('Cancellation request rejected');
            setShowMessageModal(false);
            setSelectedRequest(null);
            setCustomMessage('');
            fetchCancellationRequests(); // Refresh list
        } catch (err) {
            console.error("Failed to reject cancellation", err);
            error('Failed to reject cancellation');
        } finally {
            setProcessingId(null);
        }
    };

    const closeModal = () => {
        setShowMessageModal(false);
        setSelectedRequest(null);
        setCustomMessage('');
        setActionType('');
    };

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <XCircle className="w-8 h-8 text-red-400" />
                    Cancellation & Refund Requests
                </h1>
                <p className="text-slate-400 mt-1">
                    Review and process customer cancellation requests
                </p>
            </div>

            {/* Cancellation Requests */}
            {cancellationRequests.length === 0 ? (
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-50" />
                    <h2 className="text-xl font-semibold text-white mb-2">No Pending Cancellations</h2>
                    <p className="text-slate-400">All caught up! No cancellation requests at the moment.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {cancellationRequests.map((request) => {
                        const isPaid = request.payment_status === 'Completed';
                        const isProcessing = processingId === request.order_id;

                        return (
                            <div
                                key={request.order_id}
                                className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-4">
                                        {/* Order Header */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                                                <Package className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">
                                                    Order #{request.order_id}
                                                </h3>
                                                <p className="text-sm text-slate-400">
                                                    Requested: {new Date(request.cancelled_at || Date.now()).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Order Details */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Customer</p>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                    <p className="text-sm text-white">{request.buyer_name || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Amount</p>
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4 text-slate-400" />
                                                    <p className="text-sm text-white">₹{request.total_amount || 0}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Payment Status</p>
                                                <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${isPaid
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-amber-500/20 text-amber-400'
                                                    }`}>
                                                    {request.payment_status || 'Pending'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Order Status</p>
                                                <span className="inline-block px-2 py-1 rounded-lg text-xs font-medium bg-slate-700 text-slate-300">
                                                    {request.order_status || 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Items */}
                                        {request.items && request.items.length > 0 && (
                                            <div>
                                                <p className="text-xs text-slate-500 mb-2">Items</p>
                                                <div className="space-y-1">
                                                    {request.items.map((item, idx) => (
                                                        <p key={idx} className="text-sm text-slate-300">
                                                            • {item.product_name} x{item.quantity} - ₹{item.price * item.quantity}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Refund Warning */}
                                        {isPaid && (
                                            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-amber-400">Refund Required</p>
                                                    <p className="text-xs text-amber-300/80 mt-1">
                                                        Customer has paid ₹{request.total_amount}. If you approve cancellation,
                                                        please process the refund through your payment gateway.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 ml-4">
                                        <button
                                            onClick={() => openMessageModal(request, 'approve')}
                                            disabled={isProcessing}
                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-medium transition-all text-sm"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => openMessageModal(request, 'reject')}
                                            disabled={isProcessing}
                                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-medium transition-all text-sm"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Message Modal */}
            {showMessageModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            {actionType === 'approve' ? 'Approve Cancellation' : 'Reject Cancellation'}
                        </h3>

                        <p className="text-sm text-slate-400 mb-4">
                            Customize the message that will be sent to the customer via WhatsApp
                        </p>

                        <textarea
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            rows={6}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all mb-4"
                            placeholder="Enter your message..."
                        />

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={closeModal}
                                disabled={processingId !== null}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={actionType === 'approve' ? handleApprove : handleReject}
                                disabled={processingId !== null}
                                className={`px-6 py-2 ${actionType === 'approve'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-red-600 hover:bg-red-700'
                                    } text-white rounded-xl font-medium transition-all disabled:opacity-50`}
                            >
                                {processingId !== null ? 'Processing...' : `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
