// Orders Management JavaScript
let currentOrders = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    
    document.getElementById('status-form').addEventListener('submit', updateOrderStatus);
});

// Load Orders
async function loadOrders() {
    try {
        const response = await fetch('/static/sellers_data.json');
        const data = await response.json();
        
        // Orders are flat in sellers_data.json
        currentOrders = data.orders || [];
        
        // Sort by date (most recent first)
        currentOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        displayOrders(currentOrders);
        updateOrderStats();
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('orders-table').innerHTML = 
            '<tr><td colspan="9" class="text-center">Error loading orders</td></tr>';
    }
}

// Display Orders
function displayOrders(orders) {
    const tableBody = document.getElementById('orders-table');
    
    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center">No orders found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = orders.map(order => {
        const orderId = order.order_id || order.id;
        const totalAmount = order.total_amount || order.amount;
        const itemsDisplay = order.items && order.items.length > 0
            ? order.items.length === 1
                ? `${order.items[0].product_name} (x${order.items[0].quantity})`
                : `${order.items.length} items`
            : order.product_name ? `${order.product_name}${order.quantity ? ` (x${order.quantity})` : ''}` : 'N/A';
        
        return `
        <tr>
            <td>#${orderId}</td>
            <td>${order.buyer_name}</td>
            <td>${order.buyer_phone || '7801833884'}</td>
            <td>${order.delivery_address ? order.delivery_address.substring(0, 15) + '...' : 'N/A'}</td>
            <td>${itemsDisplay}</td>
            <td><strong>₹${totalAmount.toFixed(2)}</strong></td>
            <td><span class="status-badge status-${getStatusClass(order.payment_status)}">${order.payment_status}</span></td>
            <td><span class="status-badge status-${getStatusClass(order.order_status)}">${order.order_status}</span></td>
            <td>${formatDate(order.created_at)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewOrder(${orderId})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-success btn-sm" onclick="openStatusModal(${orderId})">
                    <i class="fas fa-edit"></i> Update
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// Filter Orders
function filterOrders(status) {
    currentFilter = status;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.status === status) {
            btn.classList.add('active');
        }
    });
    
    // Filter and display
    const filteredOrders = status === 'all' 
        ? currentOrders 
        : currentOrders.filter(order => order.order_status === status);
    
    displayOrders(filteredOrders);
}

// Update Order Stats
function updateOrderStats() {
    const receivedCount = currentOrders.filter(o => o.order_status === 'Received').length;
    const confirmedCount = currentOrders.filter(o => o.order_status === 'Confirmed').length;
    const deliveredCount = currentOrders.filter(o => o.order_status === 'Delivered').length;
    
    document.getElementById('pending-count').textContent = receivedCount;
    document.getElementById('confirmed-count').textContent = confirmedCount;
    document.getElementById('delivered-count').textContent = deliveredCount;
}

// Get status CSS class
function getStatusClass(status) {
    const statusMap = {
        'Received': 'pending',
        'Confirmed': 'confirmed',
        'Ready to Deliver': 'confirmed',
        'Shipped': 'shipped',
        'Delivered': 'delivered',
        'Cancelled': 'cancelled',
        'Pending': 'pending',
        'Requested': 'requested',
        'Completed': 'completed'
    };
    return statusMap[status] || 'pending';
}

// View Order Details
async function viewOrder(orderId) {
    const order = currentOrders.find(o => (o.order_id || o.id) === orderId);
    if (!order) return;
    
    const actualOrderId = order.order_id || order.id;
    const totalAmount = order.total_amount || order.amount;
    
    // Build items HTML
    let itemsHTML = '';
    if (order.items && order.items.length > 0) {
        itemsHTML = `
            <div class="info-display" style="margin-top: 1.5rem;">
                <h4 style="margin-bottom: 1rem; color: #2c3e50;">Order Items:</h4>
                ${order.items.map((item, index) => `
                    <div class="info-display" style="background: #f8f9fa; padding: 1rem; margin-bottom: 0.5rem; border-radius: 8px;">
                        <div class="info-item">
                            <div class="info-label">Item ${index + 1}:</div>
                            <div class="info-value"><strong>${item.product_name}</strong></div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Quantity:</div>
                            <div class="info-value">${item.quantity}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Unit Price:</div>
                            <div class="info-value">₹${item.unit_price.toFixed(2)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Subtotal:</div>
                            <div class="info-value"><strong>₹${item.subtotal.toFixed(2)}</strong></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (order.product_name) {
        // Old structure fallback
        itemsHTML = `
            <div class="info-item">
                <div class="info-label">Product:</div>
                <div class="info-value">${order.product_name}</div>
            </div>
            ${order.quantity ? `<div class="info-item">
                <div class="info-label">Quantity:</div>
                <div class="info-value">${order.quantity}</div>
            </div>` : ''}
            ${order.unit_price ? `<div class="info-item">
                <div class="info-label">Unit Price:</div>
                <div class="info-value">₹${order.unit_price.toFixed(2)}</div>
            </div>` : ''}
        `;
    }
    
    const detailsDiv = document.getElementById('order-details');
    detailsDiv.innerHTML = `
        <div class="info-display">
            <div class="info-item">
                <div class="info-label">Order ID:</div>
                <div class="info-value">#${actualOrderId}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Customer:</div>
                <div class="info-value">${order.buyer_name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Phone:</div>
                <div class="info-value">${order.buyer_phone || '7801833884'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Order Status:</div>
                <div class="info-value"><span class="status-badge status-${getStatusClass(order.order_status)}">${order.order_status}</span></div>
            </div>
            <div class="info-item">
                <div class="info-label">Payment Status:</div>
                <div class="info-value"><span class="status-badge status-${getStatusClass(order.payment_status)}">${order.payment_status}</span></div>
            </div>
            <div class="info-item">
                <div class="info-label">Order Date:</div>
                <div class="info-value">${formatDate(order.created_at)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Total Amount:</div>
                <div class="info-value"><strong>₹${totalAmount.toFixed(2)}</strong></div>
            </div>
        </div>
        
        ${itemsHTML}
        
        ${order.delivery_address ? `
        <div class="info-display" style="margin-top: 1.5rem;">
            <div class="info-item">
                <div class="info-label">Delivery Address:</div>
                <div class="info-value">${order.delivery_address}</div>
            </div>
            ${order.delivery_lat && order.delivery_lng ? `
            <div class="info-item">
                <div class="info-label">Coordinates:</div>
                <div class="info-value">Lat: ${order.delivery_lat}, Lng: ${order.delivery_lng}</div>
            </div>
            ` : ''}
        </div>
        ` : ''}
    `;
    
    document.getElementById('order-modal').classList.add('active');
}

// Close Order Modal
function closeOrderModal() {
    document.getElementById('order-modal').classList.remove('active');
}

// Open Status Modal
function openStatusModal(orderId) {
    const order = currentOrders.find(o => (o.order_id || o.id) === orderId);
    if (!order) return;
    
    document.getElementById('status-order-id').value = orderId;
    document.getElementById('order-status').value = order.order_status || 'Received';
    document.getElementById('payment-status').value = order.payment_status || 'Pending';
    
    document.getElementById('status-modal').classList.add('active');
}

// Close Status Modal
function closeStatusModal() {
    document.getElementById('status-modal').classList.remove('active');
}

// Update Order Status
async function updateOrderStatus(e) {
    e.preventDefault();
    
    const orderId = parseInt(document.getElementById('status-order-id').value);
    const newOrderStatus = document.getElementById('order-status').value;
    const newPaymentStatus = document.getElementById('payment-status').value;
    
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_status: newOrderStatus,
                payment_status: newPaymentStatus
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Order status updated successfully!', 'success');
            closeStatusModal();
            
            // Reload orders
            await loadOrders();
            filterOrders(currentFilter);
        } else {
            showNotification(result.error || 'Error updating order status', 'error');
        }
        
    } catch (error) {
        console.error('Error updating order status:', error);
        showNotification('Error updating order status', 'error');
    }
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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
    const orderModal = document.getElementById('order-modal');
    const statusModal = document.getElementById('status-modal');
    
    if (event.target === orderModal) {
        closeOrderModal();
    }
    if (event.target === statusModal) {
        closeStatusModal();
    }
}
