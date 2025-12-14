import React, { useEffect, useState } from 'react';
import { Save, Building2, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import api from '../api/axios';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';

export default function Company() {
    const [formData, setFormData] = useState({
        company_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: '',
        upi_id: '',
        company_description: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toasts, removeToast, success, error } = useToast();

    useEffect(() => {
        fetchCompanyInfo();
    }, []);

    const fetchCompanyInfo = async () => {
        try {
            const res = await api.get('/company');
            setFormData(res.data);
        } catch (error) {
            console.error("Failed to fetch company info", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/company', formData);
            success('Company information updated successfully!');
        } catch (err) {
            console.error("Failed to update company info", err);
            error('Failed to update company information.');
        } finally {
            setSaving(false);
        }
    };

    const InputGroup = ({ label, icon: Icon, name, type = "text", fullWidth = false }) => (
        <div className={fullWidth ? "col-span-2" : ""}>
            <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Icon className="w-4 h-4" /> {label}
            </label>
            <input
                type={type}
                name={name}
                value={formData[name] || ''}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
        </div>
    );

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div>
                <h1 className="text-3xl font-bold text-white">Company Profile</h1>
                <p className="text-slate-400 mt-1">Manage your business details and payment info</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 space-y-8">
                {/* Basic Info */}
                <div>
                    <h2 className="text-lg font-semibold text-white mb-6 border-b border-slate-800 pb-2">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Company Name" icon={Building2} name="company_name" fullWidth />
                        <InputGroup label="Email Address" icon={Mail} name="email" type="email" />
                        <InputGroup label="Phone Number" icon={Phone} name="phone" type="tel" />
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                            <textarea
                                name="company_description"
                                value={formData.company_description || ''}
                                onChange={handleChange}
                                rows={4}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div>
                    <h2 className="text-lg font-semibold text-white mb-6 border-b border-slate-800 pb-2">Location</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Address Line" icon={MapPin} name="address" fullWidth />
                        <InputGroup label="City" icon={MapPin} name="city" />
                        <InputGroup label="State" icon={MapPin} name="state" />
                        <InputGroup label="Pincode" icon={MapPin} name="pincode" />
                        <InputGroup label="Country" icon={MapPin} name="country" />
                    </div>
                </div>

                {/* Payments */}
                <div>
                    <h2 className="text-lg font-semibold text-white mb-6 border-b border-slate-800 pb-2">Payment Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="UPI ID" icon={CreditCard} name="upi_id" fullWidth />
                    </div>
                </div>

                {/* Social Links */}
                <div>
                    <h2 className="text-lg font-semibold text-white mb-6 border-b border-slate-800 pb-2">Social Links</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Google Business Link" icon={CreditCard} name="google_business_link" type="url" />
                        <InputGroup label="Instagram Link" icon={CreditCard} name="instagram_link" type="url" />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        {saving ? (
                            'Saving...'
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
