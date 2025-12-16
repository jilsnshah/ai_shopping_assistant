/**
 * Motion System - Reusable Framer Motion variants and spring physics
 * Inspired by Stripe, Linear, and Vercel motion design
 */

// Motion Tokens
export const duration = {
    fast: 0.15,
    normal: 0.25,
    slow: 0.4,
    slower: 0.6,
};

// Spring Physics - Natural, non-bouncy feel
export const spring = {
    gentle: { type: "spring", stiffness: 120, damping: 14 },
    snappy: { type: "spring", stiffness: 300, damping: 30 },
    bouncy: { type: "spring", stiffness: 400, damping: 10 },
    smooth: { type: "spring", stiffness: 100, damping: 20 },
};

// Easing curves
export const easing = {
    easeOut: [0.16, 1, 0.3, 1],
    easeIn: [0.4, 0, 1, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    spring: [0.43, 0.13, 0.23, 0.96],
};

// Page Transition Variants
export const pageTransition = {
    initial: {
        opacity: 0,
        y: 20,
        filter: "blur(10px)"
    },
    animate: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            duration: duration.normal,
            ease: easing.easeOut,
        }
    },
    exit: {
        opacity: 0,
        y: -10,
        filter: "blur(5px)",
        transition: {
            duration: duration.fast,
        }
    }
};

// Fade variants
export const fadeIn = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: { duration: duration.normal }
    },
    exit: { opacity: 0 }
};

export const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: duration.normal,
            ease: easing.easeOut
        }
    },
    exit: { opacity: 0, y: 10 }
};

export const fadeInDown = {
    initial: { opacity: 0, y: -20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: duration.normal,
            ease: easing.easeOut
        }
    },
    exit: { opacity: 0, y: -10 }
};

// Scale variants
export const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: spring.snappy
    },
    exit: { opacity: 0, scale: 0.95 }
};

export const popIn = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: spring.bouncy
    },
    exit: { opacity: 0, scale: 0.8 }
};

// Stagger Container
export const staggerContainer = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        }
    }
};

export const staggerContainerFast = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.03,
            delayChildren: 0.05,
        }
    }
};

// Stagger Item
export const staggerItem = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: duration.normal,
            ease: easing.easeOut
        }
    }
};

// Card variants with hover
export const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: duration.normal,
            ease: easing.easeOut
        }
    },
    hover: {
        y: -4,
        scale: 1.02,
        transition: spring.gentle
    },
    tap: {
        scale: 0.98,
        transition: spring.snappy
    }
};

// Table row variants
export const tableRowVariants = {
    initial: { opacity: 0, x: -20 },
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            duration: duration.fast,
            ease: easing.easeOut
        }
    },
    exit: {
        opacity: 0,
        x: 20,
        height: 0,
        transition: { duration: duration.fast }
    },
    hover: {
        backgroundColor: "rgba(99, 102, 241, 0.05)",
        transition: { duration: duration.fast }
    }
};

// Button variants with spring physics
export const buttonVariants = {
    initial: { scale: 1 },
    hover: {
        scale: 1.02,
        transition: spring.gentle
    },
    tap: {
        scale: 0.95,
        transition: spring.snappy
    }
};

// Glow pulse for success states
export const glowPulse = {
    initial: {
        boxShadow: "0 0 0 0 rgba(16, 185, 129, 0)"
    },
    animate: {
        boxShadow: [
            "0 0 0 0 rgba(16, 185, 129, 0)",
            "0 0 20px 10px rgba(16, 185, 129, 0.3)",
            "0 0 0 0 rgba(16, 185, 129, 0)"
        ],
        transition: {
            duration: 0.6,
            times: [0, 0.5, 1]
        }
    }
};

// Error shake
export const errorShake = {
    initial: { x: 0 },
    animate: {
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.4 }
    }
};

// Chart draw-in animation
export const chartDrawIn = {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
        pathLength: 1,
        opacity: 1,
        transition: {
            pathLength: { duration: duration.slower, ease: easing.easeOut },
            opacity: { duration: duration.fast }
        }
    }
};

// Modal/Overlay variants
export const overlayVariants = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: { duration: duration.fast }
    },
    exit: {
        opacity: 0,
        transition: { duration: duration.fast }
    }
};

export const modalVariants = {
    initial: {
        opacity: 0,
        scale: 0.95,
        y: 20
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: spring.snappy
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 10,
        transition: { duration: duration.fast }
    }
};

// Notification/Toast variants
export const toastVariants = {
    initial: {
        opacity: 0,
        y: -20,
        scale: 0.9,
        x: 20
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        x: 0,
        transition: spring.snappy
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        x: 50,
        transition: { duration: duration.fast }
    }
};

// Skeleton shimmer (for CSS animation trigger)
export const shimmer = {
    initial: { backgroundPosition: "-200% 0" },
    animate: {
        backgroundPosition: "200% 0",
        transition: {
            repeat: Infinity,
            duration: 1.5,
            ease: "linear"
        }
    }
};

// Sparkline draw animation
export const sparklineVariants = {
    initial: { pathLength: 0 },
    animate: {
        pathLength: 1,
        transition: {
            duration: duration.slow,
            ease: easing.easeOut,
            delay: 0.2
        }
    }
};

// Hover glow effect (for buttons/cards)
export const hoverGlow = {
    rest: {
        boxShadow: "0 0 0 0 rgba(99, 102, 241, 0)"
    },
    hover: {
        boxShadow: "0 0 30px -5px rgba(99, 102, 241, 0.5)",
        transition: { duration: duration.normal }
    }
};

// Number counter animation helper
export const useCountAnimation = (end, duration = 1000) => {
    // This is a placeholder - actual implementation would use useEffect
    return end;
};

export default {
    duration,
    spring,
    easing,
    pageTransition,
    fadeIn,
    fadeInUp,
    fadeInDown,
    scaleIn,
    popIn,
    staggerContainer,
    staggerContainerFast,
    staggerItem,
    cardVariants,
    tableRowVariants,
    buttonVariants,
    glowPulse,
    errorShake,
    chartDrawIn,
    overlayVariants,
    modalVariants,
    toastVariants,
    shimmer,
    sparklineVariants,
    hoverGlow
};
