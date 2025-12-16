/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                // Premium accent colors
                premium: {
                    purple: '#8B5CF6',
                    blue: '#3B82F6',
                    cyan: '#06B6D4',
                    pink: '#EC4899',
                    orange: '#F97316',
                    emerald: '#10B981',
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'premium-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'premium-gradient-2': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'premium-gradient-3': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'premium-dark': 'linear-gradient(135deg, #0c0c1d 0%, #1a1a2e 50%, #16213e 100%)',
                'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(260,80%,50%,0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(220,80%,60%,0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(280,80%,40%,0.2) 0px, transparent 50%)',
            },
            boxShadow: {
                'glow-sm': '0 0 15px -3px rgba(99, 102, 241, 0.3)',
                'glow': '0 0 25px -5px rgba(99, 102, 241, 0.4)',
                'glow-lg': '0 0 35px -5px rgba(99, 102, 241, 0.5)',
                'glow-purple': '0 0 25px -5px rgba(139, 92, 246, 0.5)',
                'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.5)',
                'glow-pink': '0 0 25px -5px rgba(236, 72, 153, 0.5)',
                'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.5)',
                'premium': '0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 30px -10px rgba(99, 102, 241, 0.3)',
                'premium-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px -15px rgba(99, 102, 241, 0.4)',
                'inner-glow': 'inset 0 0 20px rgba(99, 102, 241, 0.1)',
            },
            animation: {
                'shimmer': 'shimmer 2s linear infinite',
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                'float': 'float 6s ease-in-out infinite',
                'gradient-x': 'gradient-x 3s ease infinite',
                'gradient-y': 'gradient-y 3s ease infinite',
                'gradient-xy': 'gradient-xy 3s ease infinite',
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'spin-slow': 'spin 3s linear infinite',
            },
            keyframes: {
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'glow-pulse': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'gradient-x': {
                    '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
                    '50%': { 'background-size': '200% 200%', 'background-position': 'right center' },
                },
                'gradient-y': {
                    '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'center top' },
                    '50%': { 'background-size': '200% 200%', 'background-position': 'center bottom' },
                },
                'gradient-xy': {
                    '0%, 100%': { 'background-size': '400% 400%', 'background-position': 'left top' },
                    '50%': { 'background-size': '400% 400%', 'background-position': 'right bottom' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
            transitionDuration: {
                '400': '400ms',
            },
            borderRadius: {
                '4xl': '2rem',
            },
        },
    },
    plugins: [],
}
