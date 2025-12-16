import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, Sparkles, Shield, Zap } from 'lucide-react';
import api from '../api/axios';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/google', {
                credential: credentialResponse.credential,
                clientId: credentialResponse.clientId
            });

            if (res.data.success) {
                if (res.data.is_new_user) {
                    navigate('/onboarding');
                } else {
                    navigate('/');
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Google Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                {/* Gradient orbs */}
                <motion.div
                    animate={{
                        x: [0, 30, 0],
                        y: [0, -30, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        x: [0, -30, 0],
                        y: [0, 30, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-purple-500/25 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        x: [0, 20, 0],
                        y: [0, -20, 0],
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl"
                />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.15) 1px, transparent 0)`,
                        backgroundSize: '40px 40px'
                    }}
                />
            </div>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Gradient border wrapper */}
                <div className="p-[1px] rounded-3xl bg-gradient-to-br from-indigo-500/50 via-purple-500/30 to-indigo-500/50">
                    <div className="bg-slate-900/95 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl">
                        {/* Logo and Title */}
                        <div className="text-center mb-10">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="relative inline-block"
                            >
                                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
                                    <Store className="w-10 h-10 text-white" />
                                </div>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg"
                                >
                                    <Sparkles className="w-4 h-4 text-white" />
                                </motion.div>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-3xl font-bold bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent mb-3"
                            >
                                Welcome to SellerHub
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-slate-400"
                            >
                                AI-powered commerce at your fingertips
                            </motion.p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center mb-6 backdrop-blur-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Google Login Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex justify-center"
                        >
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => {
                                    setError('Google Login Failed');
                                }}
                                theme="filled_black"
                                shape="pill"
                                size="large"
                                width="100%"
                            />
                        </motion.div>

                        {/* Features */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="mt-8 pt-6 border-t border-slate-800/50"
                        >
                            <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Secure</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Fast</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                                    <span>AI-Powered</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="mt-6 text-center"
                        >
                            <p className="text-slate-600 text-xs">
                                No password required • Powered by Google
                            </p>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
