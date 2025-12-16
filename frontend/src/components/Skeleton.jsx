import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

/**
 * Skeleton Loaders - Premium shimmer effect loading states
 */

// Base skeleton with shimmer
const SkeletonBase = ({ className, ...props }) => (
    <div
        className={cn(
            "relative overflow-hidden bg-slate-800/50 rounded-lg",
            "before:absolute before:inset-0",
            "before:bg-gradient-to-r before:from-transparent before:via-slate-700/50 before:to-transparent",
            "before:animate-[shimmer_2s_infinite]",
            "before:-translate-x-full",
            className
        )}
        {...props}
    />
);

// Text skeleton
export const SkeletonText = ({ lines = 1, className }) => (
    <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
            <SkeletonBase
                key={i}
                className={cn(
                    "h-4",
                    i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
                )}
            />
        ))}
    </div>
);

// Circle skeleton (avatars)
export const SkeletonCircle = ({ size = "md", className }) => {
    const sizes = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16",
        xl: "w-24 h-24"
    };

    return <SkeletonBase className={cn("rounded-full", sizes[size], className)} />;
};

// Stat Card Skeleton
export const SkeletonStatCard = ({ className }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
            "stat-card p-6 space-y-4",
            className
        )}
    >
        <div className="flex justify-between items-start">
            <SkeletonBase className="w-12 h-12 rounded-xl" />
            <SkeletonBase className="w-16 h-6 rounded-full" />
        </div>
        <SkeletonBase className="h-4 w-24" />
        <SkeletonBase className="h-8 w-32" />
    </motion.div>
);

// Table Row Skeleton
export const SkeletonTableRow = ({ columns = 6, className }) => (
    <tr className={cn("border-b border-slate-800/30", className)}>
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i} className="px-6 py-4">
                <SkeletonBase className={cn(
                    "h-4",
                    i === 0 ? "w-20" : i === columns - 1 ? "w-24" : "w-32"
                )} />
            </td>
        ))}
    </tr>
);

// Table Skeleton
export const SkeletonTable = ({ rows = 5, columns = 6, className }) => (
    <div className={cn("glass-card rounded-2xl overflow-hidden", className)}>
        <table className="w-full">
            <thead>
                <tr className="border-b border-slate-800/50 bg-slate-900/50">
                    {Array.from({ length: columns }).map((_, i) => (
                        <th key={i} className="px-6 py-4">
                            <SkeletonBase className="h-3 w-20" />
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                    <SkeletonTableRow key={i} columns={columns} />
                ))}
            </tbody>
        </table>
    </div>
);

// Product Card Skeleton
export const SkeletonProductCard = ({ className }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("glass-card rounded-2xl overflow-hidden", className)}
    >
        <SkeletonBase className="h-48 w-full rounded-none" />
        <div className="p-5 space-y-3">
            <SkeletonBase className="h-5 w-3/4" />
            <SkeletonBase className="h-4 w-full" />
            <SkeletonBase className="h-4 w-2/3" />
            <div className="flex justify-between items-center pt-2">
                <SkeletonBase className="h-7 w-20" />
                <SkeletonBase className="h-6 w-24 rounded-full" />
            </div>
        </div>
    </motion.div>
);

// Chart Skeleton
export const SkeletonChart = ({ height = 300, className }) => (
    <div className={cn("glass-card rounded-2xl p-6", className)}>
        <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
                <SkeletonBase className="h-5 w-40" />
                <SkeletonBase className="h-3 w-24" />
            </div>
            <SkeletonBase className="h-8 w-24 rounded-lg" />
        </div>
        <div className="relative" style={{ height }}>
            {/* Chart area skeleton */}
            <SkeletonBase className="absolute bottom-0 left-0 right-0 h-3/4 rounded-lg" />
            {/* Fake bars */}
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around gap-2 px-4 h-3/4">
                {[0.6, 0.8, 0.5, 0.9, 0.7, 0.4, 0.75].map((h, i) => (
                    <SkeletonBase
                        key={i}
                        className="flex-1 rounded-t-lg"
                        style={{ height: `${h * 100}%` }}
                    />
                ))}
            </div>
        </div>
    </div>
);

// Customer Card Skeleton
export const SkeletonCustomerCard = ({ className }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn("glass-card rounded-2xl p-5", className)}
    >
        <div className="flex items-center gap-4">
            <SkeletonCircle size="lg" />
            <div className="flex-1 space-y-2">
                <SkeletonBase className="h-5 w-32" />
                <SkeletonBase className="h-4 w-28" />
            </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1">
                    <SkeletonBase className="h-3 w-full" />
                    <SkeletonBase className="h-5 w-3/4" />
                </div>
            ))}
        </div>
    </motion.div>
);

// Inline Skeleton for text placeholders
export const SkeletonInline = ({ width = "100px", className }) => (
    <SkeletonBase
        className={cn("h-4 inline-block align-middle", className)}
        style={{ width }}
    />
);

// Grid of skeleton cards
export const SkeletonGrid = ({ count = 4, CardComponent = SkeletonProductCard, className }) => (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", className)}>
        {Array.from({ length: count }).map((_, i) => (
            <CardComponent key={i} />
        ))}
    </div>
);

export default {
    Base: SkeletonBase,
    Text: SkeletonText,
    Circle: SkeletonCircle,
    StatCard: SkeletonStatCard,
    TableRow: SkeletonTableRow,
    Table: SkeletonTable,
    ProductCard: SkeletonProductCard,
    Chart: SkeletonChart,
    CustomerCard: SkeletonCustomerCard,
    Inline: SkeletonInline,
    Grid: SkeletonGrid
};
