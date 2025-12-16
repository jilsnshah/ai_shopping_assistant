import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, MoreVertical, Trash2, Edit, X, ChevronDown, Upload, Image } from 'lucide-react';
import api from '../api/axios';
import { cn } from '../lib/utils';
import { staggerContainer, staggerItem, cardVariants } from '../lib/motion';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { EmptyProducts } from '../components/EmptyStates';
import { SkeletonProductCard } from '../components/Skeleton';

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
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [isUploading, setIsUploading] = useState(false);
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
        setImageFile(null);
        setImagePreview('');
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
        setImageFile(null);
        setImagePreview(product.image_url || ''); // Show existing image as preview
        setIsModalOpen(true);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                error('Please select an image file');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                error('Image size should be less than 5MB');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const uploadImageToStorage = async (file) => {
        // Upload via backend to avoid CORS issues
        const formData = new FormData();
        formData.append('image', file);

        const response = await api.post('/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
            return response.data.url;
        } else {
            throw new Error(response.data.error || 'Upload failed');
        }
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
        setIsUploading(true);

        try {
            let imageUrl = formData.image_url;

            // Upload new image if one was selected
            if (imageFile) {
                imageUrl = await uploadImageToStorage(imageFile);
            }

            const productData = {
                ...formData,
                image_url: imageUrl
            };

            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, productData);
                setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
                success('Product updated successfully!');
            } else {
                const res = await api.post('/products', productData);
                setProducts([...products, res.data.product]);
                success('Product created successfully!');
            }
            setIsModalOpen(false);
            setImageFile(null);
            setImagePreview('');
            fetchProducts();
        } catch (err) {
            console.error("Failed to save product", err);
            error("Failed to save product");
        } finally {
            setIsUploading(false);
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
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div className="page-header">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Products</h1>
                    <p className="text-slate-400 mt-1">Manage your inventory and catalog</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAdd}
                    className="btn-premium flex items-center gap-2 text-white"
                >
                    <Plus className="w-5 h-5" />
                    Add Product
                </motion.button>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row gap-4 glass-card p-3 rounded-2xl w-full md:w-auto"
            >
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full input-premium pl-11"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all">
                    <Filter className="w-4 h-4" />
                    Filters
                </button>
            </motion.div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-indigo-500/30 rounded-full animate-spin border-t-indigo-500" />
                </div>
            ) : (
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {filteredProducts.map((product, index) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                                key={product.id}
                                className="glass-card rounded-2xl overflow-hidden group hover:shadow-glow transition-all duration-500"
                            >
                                {/* Image Area */}
                                <div className="h-48 bg-slate-800/50 relative overflow-hidden">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-600 font-bold text-5xl">
                                            {product.title.charAt(0)}
                                        </div>
                                    )}
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                                    {/* Action buttons */}
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleEdit(product)}
                                            className="p-2.5 bg-slate-950/80 backdrop-blur-sm text-white rounded-xl hover:bg-indigo-600 transition-colors border border-slate-700/50"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleDelete(product.id)}
                                            className="p-2.5 bg-slate-950/80 backdrop-blur-sm text-white rounded-xl hover:bg-red-600 transition-colors border border-slate-700/50"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                    {/* Category badge */}
                                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-white uppercase tracking-wider border border-slate-700/50">
                                        {product.category || 'General'}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="font-semibold text-lg text-white mb-1 truncate group-hover:text-indigo-200 transition-colors">{product.title}</h3>
                                    <p className="text-slate-400 text-sm line-clamp-2 mb-4 h-10">{product.description || 'No description available'}</p>

                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">₹{product.price}</span>
                                        <div className={cn("text-xs font-semibold px-3 py-1.5 rounded-full border",
                                            product.stock_quantity > 10
                                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                                                : "text-amber-400 bg-amber-500/10 border-amber-500/30"
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
                                <label className="block text-sm font-medium text-slate-400 mb-1">Product Image</label>
                                <div className="flex items-start gap-4">
                                    {/* Image Preview */}
                                    <div className="w-24 h-24 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Image className="w-8 h-8 text-slate-600" />
                                        )}
                                    </div>
                                    {/* Upload Button */}
                                    <div className="flex-1">
                                        <label className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900 hover:border-indigo-500 transition-colors">
                                            <Upload className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm text-slate-400">
                                                {imageFile ? imageFile.name : 'Choose image...'}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageSelect}
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-xs text-slate-500 mt-1">Max 5MB. JPG, PNG, WEBP supported.</p>
                                    </div>
                                </div>
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
                                    disabled={isUploading}
                                    className={cn(
                                        "px-6 py-2 text-white rounded-lg transition-colors font-medium flex items-center gap-2",
                                        isUploading
                                            ? "bg-indigo-600/50 cursor-not-allowed"
                                            : "bg-indigo-600 hover:bg-indigo-700"
                                    )}
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        editingProduct ? 'Save Changes' : 'Create Product'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
