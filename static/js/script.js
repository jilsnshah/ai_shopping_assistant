// Utility function to show messages
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

// Smooth scroll for navigation links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
});

// Register Form Handler
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            company_name: document.getElementById('company_name').value,
            company_description: document.getElementById('company_description').value
        };
        
        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showMessage('registerMessage', 
                    `Success! ${data.seller.company_name} has been registered.`, 
                    'success');
                registerForm.reset();
                
                // Store seller ID in localStorage for future use
                localStorage.setItem('seller_id', data.seller.id);
            } else {
                showMessage('registerMessage', 
                    `Error: ${data.error}`, 
                    'error');
            }
        } catch (error) {
            showMessage('registerMessage', 
                `Error: ${error.message}`, 
                'error');
        }
    });
}

// Add Product Form Handler
const addProductForm = document.getElementById('addProductForm');
if (addProductForm) {
    addProductForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Basic validation
        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        const price = parseFloat(document.getElementById('price').value);
        
        if (!title || !description) {
            showMessage('addProductMessage', 
                'Please fill in all required fields', 
                'error');
            return;
        }
        
        if (price <= 0) {
            showMessage('addProductMessage', 
                'Price must be greater than 0', 
                'error');
            return;
        }
        
        // Always use seller_id 1 by default
        const sellerId = 1;
        
        // Create JSON payload (no FormData for image upload)
        const productData = {
            title: title,
            description: description,
            price: price,
            seller_id: sellerId
        };
        
        try {
            const response = await fetch('/add_product', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showMessage('addProductMessage', 
                    `Success! ${data.product.title} has been added with Product ID: ${data.product_id}`, 
                    'success');
                addProductForm.reset();
                
                // Reload products list
                loadProducts();
            } else {
                showMessage('addProductMessage', 
                    `Error: ${data.error}`, 
                    'error');
            }
        } catch (error) {
            showMessage('addProductMessage', 
                `Error: ${error.message}`, 
                'error');
        }
    });
}

// Load Products Function
async function loadProducts() {
    const productsContainer = document.getElementById('productsContainer');
    const productsMessage = document.getElementById('productsMessage');
    
    // Show loading state
    productsContainer.innerHTML = '<div class="loading-container"><div class="loading"></div></div>';
    
    try {
        const sellerId = 1; // Always use seller_id 1 by default
        const response = await fetch(`/products?seller_id=${sellerId}`);
        const data = await response.json();
        
        if (response.ok) {
            if (data.products && data.products.length > 0) {
                productsContainer.innerHTML = '';
                data.products.forEach(product => {
                    const productCard = createProductCard(product);
                    productsContainer.appendChild(productCard);
                });
                productsMessage.style.display = 'none';
            } else {
                productsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📦</div>
                        <p>No products yet. Add your first product above!</p>
                    </div>
                `;
            }
        } else {
            showMessage('productsMessage', 
                `Error: ${data.error}`, 
                'error');
        }
    } catch (error) {
        showMessage('productsMessage', 
            `Error: ${error.message}`, 
            'error');
    }
}

// Create Product Card Element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
        <div class="product-image placeholder">�</div>
        <div class="product-info">
            <div class="product-id">Product ID: #${product.id}</div>
            <h3 class="product-title">${escapeHtml(product.title)}</h3>
            <p class="product-description">${escapeHtml(product.description)}</p>
            <p class="product-price">$${product.price.toFixed(2)}</p>
        </div>
    `;
    
    return card;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Activate AI Button Handler
const activateAIBtn = document.getElementById('activateAIBtn');
if (activateAIBtn) {
    activateAIBtn.addEventListener('click', async function() {
        try {
            const response = await fetch('/activate_ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            showMessage('aiMessage', 
                data.message, 
                'info');
        } catch (error) {
            showMessage('aiMessage', 
                `Error: ${error.message}`, 
                'error');
        }
    });
}

// Load products on page load
window.addEventListener('DOMContentLoaded', function() {
    loadProducts();
});


