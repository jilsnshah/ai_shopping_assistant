import React from 'react';
import { motion } from 'framer-motion';
import { sparklineVariants } from '../lib/motion';

/**
 * Mini Sparkline Component - Renders an animated mini chart
 */
export const Sparkline = ({
    data = [],
    width = 80,
    height = 32,
    color = '#6366f1',
    gradientId = 'sparkline-gradient',
    animate = true,
    className = ''
}) => {
    if (!data.length) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    // Calculate points for the path
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
    });

    const pathD = `M${points.join(' L')}`;

    // Create area fill path
    const areaPoints = [
        `0,${height}`,
        ...points,
        `${width},${height}`
    ];
    const areaD = `M${areaPoints.join(' L')}Z`;

    return (
        <div className={`sparkline-container ${className}`} style={{ width, height }}>
            <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id={`${gradientId}-stroke`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                        <stop offset="50%" stopColor={color} stopOpacity="1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.5" />
                    </linearGradient>
                </defs>

                {/* Area fill */}
                <motion.path
                    d={areaD}
                    fill={`url(#${gradientId})`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                />

                {/* Line stroke */}
                <motion.path
                    d={pathD}
                    fill="none"
                    stroke={`url(#${gradientId}-stroke)`}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={animate ? { pathLength: 0, opacity: 0 } : {}}
                    animate={animate ? { pathLength: 1, opacity: 1 } : {}}
                    transition={{
                        pathLength: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                        opacity: { duration: 0.2 }
                    }}
                    style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
                />

                {/* End point dot */}
                <motion.circle
                    cx={width}
                    cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
                    r="3"
                    fill={color}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
                    style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                />
            </svg>
        </div>
    );
};

/**
 * Trend Sparkline - Shows trend direction with color
 */
export const TrendSparkline = ({ data = [], trend = 'up' }) => {
    const color = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6366f1';
    return <Sparkline data={data} color={color} />;
};

/**
 * Stat Sparkline - Compact version for stat cards
 */
export const StatSparkline = ({ data = [], className = '' }) => {
    return (
        <Sparkline
            data={data}
            width={60}
            height={24}
            color="#6366f1"
            className={className}
        />
    );
};

export default Sparkline;
