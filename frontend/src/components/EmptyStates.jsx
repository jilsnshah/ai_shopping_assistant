import React from 'react';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Users, FileText, MessageSquare } from 'lucide-react';

/**
 * Premium Empty States - Replace boring empty screens with helpful, delightful ones
 */

const EmptyStateBase = ({
    icon: Icon,
    title,
    description,
    action,
    actionLabel,
    className = ''
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`empty-state ${className}`}
    >
        <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="empty-state-icon float-animation"
        >
            <Icon className="w-12 h-12 text-indigo-400" />
        </motion.div>

        <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="empty-state-title"
        >
            {title}
        </motion.h3>

        <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="empty-state-description"
        >
            {description}
        </motion.p>

        {action && (
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={action}
                className="btn-premium text-white"
            >
                {actionLabel}
            </motion.button>
        )}
    </motion.div>
);

// Empty Orders State
export const EmptyOrders = ({ onAction }) => (
    <EmptyStateBase
        icon={ShoppingCart}
        title="No orders yet"
        description="When customers place orders through WhatsApp, they'll appear here. Start promoting your products to get your first order!"
        action={onAction}
        actionLabel="View Products"
    />
);

// Empty Products State
export const EmptyProducts = ({ onAction }) => (
    <EmptyStateBase
        icon={Package}
        title="No products in catalog"
        description="Add your first product to start receiving orders. Customers will be able to browse and order through WhatsApp."
        action={onAction}
        actionLabel="Add First Product"
    />
);

// Empty Customers State
export const EmptyCustomers = ({ onAction }) => (
    <EmptyStateBase
        icon={Users}
        title="No customers yet"
        description="Customers who message you on WhatsApp will appear here. Share your WhatsApp number to start building your customer base."
        action={onAction}
        actionLabel="View Dashboard"
    />
);

// Empty Conversation State
export const EmptyConversation = () => (
    <EmptyStateBase
        icon={MessageSquare}
        title="No messages yet"
        description="Start a conversation with this customer. Messages will appear here in real-time."
    />
);

// Empty Chart State
export const EmptyChart = ({ title = "No data available" }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
    >
        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-slate-600" />
        </div>
        <p className="text-slate-500 text-sm">{title}</p>
        <p className="text-slate-600 text-xs mt-1">Data will appear once available</p>
    </motion.div>
);

// Generic Empty State
export const EmptyState = EmptyStateBase;

export default {
    Orders: EmptyOrders,
    Products: EmptyProducts,
    Customers: EmptyCustomers,
    Conversation: EmptyConversation,
    Chart: EmptyChart,
    Base: EmptyStateBase
};
