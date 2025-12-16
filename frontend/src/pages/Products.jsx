import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, MoreVertical, Trash2, Edit, X, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import { cn } from '../lib/utils';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        category: '',
        stock_quantity: '',
        description: '',
        image_url: '',
        features: [] // Array of {name, type, required, options}
    });
    const [newFeature, setNewFeature] = useState({
        name: '',
        type: 'multiple_choice',
        required: true,
        options: ''
    });
    const { toasts, removeToast, success, error } = useToast();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data.products || []);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/products/${id}`);
                setProducts(products.filter(p => p.id !== id));
            } catch (error) {
                console.error("Failed to delete", error);
            }
        }
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setFormData({
            title: '',
            price: '',
            category: '',
            stock_quantity: '',
            description: '',
            image_url: '',
            features: []
        });
        setNewFeature({ name: '', type: 'multiple_choice', required: true, options: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            title: product.title,
            price: product.price,
            category: product.category,
            stock_quantity: product.stock_quantity,
            description: product.description,
            image_url: product.image_url,
            features: product.features || []
        });
        setNewFeature({ name: '', type: 'multiple_choice', required: true, options: '' });
        setIsModalOpen(true);
    };

    const addFeature = () => {
        if (!newFeature.name.trim()) return;

        const feature = {
            name: newFeature.name.trim(),
            type: newFeature.type,
            required: newFeature.required,
            ...(newFeature.type === 'multiple_choice' && {
                options: newFeature.options.split(',').map(o => o.trim()).filter(o => o)
            })
        };

        setFormData({ ...formData, features: [...formData.features, feature] });
        setNewFeature({ name: '', type: 'multiple_choice', required: true, options: '' });
    };

    const removeFeature = (index) => {
        setFormData({
            ...formData,
            features: formData.features.filter((_, i) => i !== index)
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, formData);
                setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...formData } : p));
            } else {
                const res = await api.post('/products', formData);
                setProducts([...products, res.data.product]);
            }
            setIsModalOpen(false);
            fetchProducts(); // Refresh to be safe
        } catch (err) {
            console.error("Failed to save product", err);
            error("Failed to save product");
        }
    };

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Products</h1>
                    <p className="text-slate-400 mt-1">Manage your inventory and catalog</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Add Product
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 w-full md:w-auto">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border-none rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                    <Filter className="w-4 h-4" />
                    Filters
                </button>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-white">Loading products...</div>
            ) : (
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {filteredProducts.map((product) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                key={product.id}
                                className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden group hover:border-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/10"
                            >
                                {/* Image Area */}
                                <div className="h-48 bg-slate-800 relative overflow-hidden">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-600 font-bold text-4xl">
                                            {product.title.charAt(0)}
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="p-2 bg-slate-950/80 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="p-2 bg-slate-950/80 text-white rounded-lg hover:bg-red-600 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-1 rounded-lg text-xs font-bold text-white uppercase tracking-wider backdrop-blur-md">
                                        {product.category || 'General'}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="font-semibold text-lg text-white mb-1 truncate">{product.title}</h3>
                                    <p className="text-slate-400 text-sm line-clamp-2 mb-4 h-10">{product.description || 'No description available'}</p>

                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold text-indigo-400">₹{product.price}</span>
                                        <div className={cn("text-xs font-medium px-2 py-1 rounded-full",
                                            product.stock_quantity > 10 ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                                        )}>
                                            {product.stock_quantity} in stock
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto my-4"
                    >
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.stock_quantity}
                                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Image URL</label>
                                <input
                                    type="url"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Features Section */}
                            <div className="border-t border-slate-800 pt-4 mt-4">
                                <label className="block text-sm font-medium text-slate-300 mb-3">Product Features (Optional)</label>

                                {/* Existing Features */}
                                {formData.features.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        {formData.features.map((feature, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                                                <div className="flex-1">
                                                    <span className="text-white font-medium">{feature.name}</span>
                                                    <span className={cn("ml-2 text-xs px-2 py-0.5 rounded-full",
                                                        feature.type === 'multiple_choice' ? "bg-indigo-500/20 text-indigo-400" :
                                                            feature.type === 'text' ? "bg-emerald-500/20 text-emerald-400" :
                                                                "bg-amber-500/20 text-amber-400"
                                                    )}>
                                                        {feature.type}
                                                    </span>
                                                    <span className={cn("ml-2 text-xs px-2 py-0.5 rounded-full",
                                                        feature.required ? "bg-red-500/20 text-red-400" : "bg-slate-600/50 text-slate-400"
                                                    )}>
                                                        {feature.required ? 'Required' : 'Optional'}
                                                    </span>
                                                    {feature.options && (
                                                        <span className="ml-2 text-xs text-slate-500">
                                                            [{feature.options.join(', ')}]
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFeature(index)}
                                                    className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add New Feature Form */}
                                <div className="bg-slate-800/30 rounded-lg p-3 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Feature name (e.g., Size)"
                                            value={newFeature.name}
                                            onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <select
                                            value={newFeature.type}
                                            onChange={(e) => setNewFeature({ ...newFeature, type: e.target.value })}
                                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="multiple_choice">Multiple Choice</option>
                                            <option value="text">Text Input</option>
                                            <option value="numeric">Numeric</option>
                                        </select>
                                    </div>

                                    {newFeature.type === 'multiple_choice' && (
                                        <input
                                            type="text"
                                            placeholder="Options (comma separated, e.g., S, M, L, XL)"
                                            value={newFeature.options}
                                            onChange={(e) => setNewFeature({ ...newFeature, options: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                    )}

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newFeature.required}
                                                onChange={(e) => setNewFeature({ ...newFeature, required: e.target.checked })}
                                                className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-indigo-500"
                                            />
                                            Required for ordering
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addFeature}
                                            disabled={!newFeature.name.trim()}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Feature
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    {editingProduct ? 'Save Changes' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
