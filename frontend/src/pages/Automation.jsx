import React, { useState, useEffect } from 'react';
import { GripVertical, Save, RotateCcw, Workflow, CheckCircle2, XCircle, Clock, Package, Truck, BadgeCheck, DollarSign, PauseCircle } from 'lucide-react';
import api from '../api/axios';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';

// Available workflow blocks with icons and colors
const AVAILABLE_BLOCKS = [
    {
        id: 'order_created',
        label: 'Order Created by Customer',
        icon: Package,
        color: 'from-blue-500 to-cyan-500',
        description: 'Customer places a new order'
    },
    {
        id: 'order_accepted',
        label: 'Order Accepted by You',
        icon: CheckCircle2,
        color: 'from-green-500 to-emerald-500',
        description: 'You confirm the order'
    },
    {
        id: 'order_prepared',
        label: 'Order Prepared for Dispatch',
        icon: Clock,
        color: 'from-amber-500 to-orange-500',
        description: 'Order is ready to ship'
    },
    {
        id: 'order_out_for_delivery',
        label: 'Order Out for Delivery',
        icon: Truck,
        color: 'from-purple-500 to-pink-500',
        description: 'Order is in transit'
    },
    {
        id: 'order_delivered',
        label: 'Order Successfully Delivered',
        icon: BadgeCheck,
        color: 'from-teal-500 to-green-500',
        description: 'Order completed successfully'
    },
    {
        id: 'cancellation_allowed',
        label: 'Cancellation Allowed Until This Step',
        icon: XCircle,
        color: 'from-red-500 to-rose-500',
        description: 'Last step where cancellation is possible'
    },
    {
        id: 'request_payment',
        label: 'Request Customer Payment',
        icon: DollarSign,
        color: 'from-indigo-500 to-blue-500',
        description: 'Send payment request to customer'
    },
    {
        id: 'pause_until_payment',
        label: 'Pause Workflow Until Payment Received',
        icon: PauseCircle,
        color: 'from-violet-500 to-purple-500',
        description: 'Wait for payment confirmation'
    }
];

export default function Automation() {
    const [workflowBlocks, setWorkflowBlocks] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toasts, removeToast, success, error } = useToast();

    useEffect(() => {
        fetchWorkflow();
    }, []);

    const fetchWorkflow = async () => {
        try {
            const res = await api.get('/workflow');
            if (res.data && res.data.blocks && res.data.blocks.length > 0) {
                setWorkflowBlocks(res.data.blocks);
            } else {
                // Set default workflow if none exists
                setWorkflowBlocks([
                    'order_created',
                    'order_accepted',
                    'request_payment',
                    'pause_until_payment',
                    'order_prepared',
                    'order_out_for_delivery',
                    'order_delivered'
                ]);
            }
        } catch (err) {
            console.error("Failed to fetch workflow", err);
            // Set default workflow on error
            setWorkflowBlocks([
                'order_created',
                'order_accepted',
                'request_payment',
                'pause_until_payment',
                'order_prepared',
                'order_out_for_delivery',
                'order_delivered'
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/workflow', { blocks: workflowBlocks });
            success('Workflow saved successfully!');
        } catch (err) {
            console.error("Failed to save workflow", err);
            error('Failed to save workflow.');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setWorkflowBlocks([
            'order_created',
            'order_accepted',
            'request_payment',
            'pause_until_payment',
            'order_prepared',
            'order_out_for_delivery',
            'order_delivered'
        ]);
        success('Workflow reset to default');
    };

    const handleDragStart = (e, index) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === dropIndex) {
            setDraggedItem(null);
            setDragOverIndex(null);
            return;
        }

        const newBlocks = [...workflowBlocks];
        const draggedBlock = newBlocks[draggedItem];
        newBlocks.splice(draggedItem, 1);
        newBlocks.splice(dropIndex, 0, draggedBlock);

        setWorkflowBlocks(newBlocks);
        setDraggedItem(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverIndex(null);
    };

    const addBlock = (blockId) => {
        if (!workflowBlocks.includes(blockId)) {
            setWorkflowBlocks([...workflowBlocks, blockId]);
            success('Block added to workflow');
        } else {
            error('Block already exists in workflow');
        }
    };

    const removeBlock = (index) => {
        const newBlocks = workflowBlocks.filter((_, i) => i !== index);
        setWorkflowBlocks(newBlocks);
        success('Block removed from workflow');
    };

    const getBlockData = (blockId) => {
        return AVAILABLE_BLOCKS.find(b => b.id === blockId) || {};
    };

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Workflow className="w-8 h-8 text-indigo-400" />
                        Workflow Automation
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Customize your order processing workflow by arranging blocks in your preferred sequence
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-medium transition-all"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Workflow'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Workflow Builder */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Your Workflow</h2>
                        <p className="text-sm text-slate-400 mb-6">
                            Drag and drop blocks to reorder your workflow steps
                        </p>

                        {workflowBlocks.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <Workflow className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                <p>No blocks in workflow. Add blocks from the available blocks panel.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {workflowBlocks.map((blockId, index) => {
                                    const blockData = getBlockData(blockId);
                                    const Icon = blockData.icon || Package;
                                    const isDragging = draggedItem === index;
                                    const isDropTarget = dragOverIndex === index;

                                    return (
                                        <div
                                            key={`${blockId}-${index}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, index)}
                                            onDragEnd={handleDragEnd}
                                            className={`
                                                group relative flex items-center gap-4 bg-slate-950/50 border rounded-xl p-4 transition-all cursor-move
                                                ${isDragging ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}
                                                ${isDropTarget ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-slate-800 hover:border-slate-700'}
                                            `}
                                        >
                                            {/* Step Number */}
                                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400">
                                                {index + 1}
                                            </div>

                                            {/* Icon */}
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${blockData.color} flex items-center justify-center`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>

                                            {/* Label & Description */}
                                            <div className="flex-1">
                                                <h3 className="text-white font-medium">{blockData.label}</h3>
                                                <p className="text-xs text-slate-400 mt-1">{blockData.description}</p>
                                            </div>

                                            {/* Drag Handle */}
                                            <GripVertical className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />

                                            {/* Remove Button */}
                                            <button
                                                onClick={() => removeBlock(index)}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>

                                            {/* Connector Line */}
                                            {index < workflowBlocks.length - 1 && (
                                                <div className="absolute left-8 -bottom-3 w-0.5 h-3 bg-slate-700" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Available Blocks */}
                <div className="space-y-4">
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Available Blocks</h2>
                        <p className="text-sm text-slate-400 mb-6">
                            Click to add blocks to your workflow
                        </p>

                        <div className="space-y-3">
                            {AVAILABLE_BLOCKS.map((block) => {
                                const Icon = block.icon;
                                const isInWorkflow = workflowBlocks.includes(block.id);

                                return (
                                    <button
                                        key={block.id}
                                        onClick={() => addBlock(block.id)}
                                        disabled={isInWorkflow}
                                        className={`
                                            w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left
                                            ${isInWorkflow
                                                ? 'bg-slate-800/50 opacity-50 cursor-not-allowed'
                                                : 'bg-slate-950/50 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/50 cursor-pointer'
                                            }
                                        `}
                                    >
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${block.color} flex items-center justify-center`}>
                                            <Icon className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{block.label}</p>
                                            {isInWorkflow && (
                                                <p className="text-xs text-green-400 mt-0.5">Already in workflow</p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-indigo-900/20 border border-indigo-800/30 rounded-2xl p-4">
                        <h3 className="text-sm font-semibold text-indigo-300 mb-2">💡 Tips</h3>
                        <ul className="text-xs text-slate-400 space-y-2">
                            <li>• Drag blocks to reorder them</li>
                            <li>• Click blocks to add them</li>
                            <li>• Hover and click X to remove</li>
                            <li>• Save your changes when done</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
