// Products Management JavaScript
let currentProducts = [];
let editingProductId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    
    document.getElementById('product-form').addEventListener('submit', saveProduct);
});

// Load Products
async function loadProducts() {
    try {
        const response = await fetch('/static/sample_data.json');
        const data = await response.json();
        currentProducts = data.products || [];
        
        displayProducts(currentProducts);
        updateProductStats();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-grid').innerHTML = 
            '<div class="loading-spinner"><i class="fas fa-exclamation-circle"></i> Error loading products</div>';
    }
}

// Display Products
function displayProducts(products) {
    const grid = document.getElementById('products-grid');
    
    if (products.length === 0) {
        grid.innerHTML = '<div class="loading-spinner">No products found. Add your first product!</div>';
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">
                ${product.image_url ? 
                    `<img src="${product.image_url}" alt="${product.title}">` : 
                    '<i class="fas fa-box"></i>'
                }
            </div>
            <div class="product-info">
                <div class="product-category">${product.category || 'Uncategorized'}</div>
                <h3 class="product-name">${product.title}</h3>
                ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                <div class="product-details">
                    <div class="product-price">₹${parseFloat(product.price).toFixed(2)}</div>
                    ${product.stock_quantity !== undefined ? `<div class="product-stock">
                        <i class="fas fa-boxes"></i> ${product.stock_quantity} in stock
                    </div>` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary btn-sm" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Update Product Stats
function updateProductStats() {
    const totalProducts = currentProducts.length;
    const totalValue = currentProducts.reduce((sum, p) => sum + (parseFloat(p.price) * (p.stock_quantity || 0)), 0);
    
    document.getElementById('products-count').textContent = totalProducts;
    document.getElementById('products-value').textContent = `₹${totalValue.toFixed(2)}`;
}

// Open Product Modal
function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const title = document.getElementById('modal-title');
    
    form.reset();
    editingProductId = productId;
    
    if (productId) {
        // Edit mode
        const product = currentProducts.find(p => p.id === productId);
        if (product) {
            title.textContent = 'Edit Product';
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.title;
            document.getElementById('category').value = product.category || '';
            document.getElementById('price').value = product.price;
            document.getElementById('stock').value = product.stock_quantity || 0;
            document.getElementById('description').value = product.description || '';
            document.getElementById('image-url').value = product.image_url || '';
        }
    } else {
        // Add mode
        title.textContent = 'Add New Product';
        document.getElementById('product-id').value = '';
    }
    
    modal.classList.add('active');
}

// Close Product Modal
function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
    editingProductId = null;
}

// Save Product
async function saveProduct(e) {
    e.preventDefault();
    
    const productData = {
        title: document.getElementById('product-name').value,
        category: document.getElementById('category').value,
        price: parseFloat(document.getElementById('price').value),
        stock_quantity: parseInt(document.getElementById('stock').value),
        description: document.getElementById('description').value,
        image_url: document.getElementById('image-url').value,
        seller_id: 1  // Default seller ID
    };
    
    try {
        let response;
        
        if (editingProductId) {
            // Update existing product
            response = await fetch(`/api/products/${editingProductId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        } else {
            // Create new product
            response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        }
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification(editingProductId ? 'Product updated successfully!' : 'Product added successfully!', 'success');
            closeProductModal();
            
            // Reload products
            await loadProducts();
        } else {
            showNotification(result.error || 'Error saving product', 'error');
        }
        
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('Error saving product', 'error');
    }
}

// Edit Product
function editProduct(productId) {
    openProductModal(productId);
}

// Delete Product
function deleteProduct(productId) {
    editingProductId = productId;
    document.getElementById('delete-modal').classList.add('active');
}

// Confirm Delete
async function confirmDelete() {
    try {
        const response = await fetch(`/api/products/${editingProductId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Product deleted successfully!', 'success');
            closeDeleteModal();
            
            // Reload products
            await loadProducts();
        } else {
            showNotification(result.error || 'Error deleting product', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Error deleting product', 'error');
    }
}

// Close Delete Modal
function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('active');
    editingProductId = null;
}

// Show Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 9999;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const productModal = document.getElementById('product-modal');
    const deleteModal = document.getElementById('delete-modal');
    
    if (event.target === productModal) {
        closeProductModal();
    }
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
}
