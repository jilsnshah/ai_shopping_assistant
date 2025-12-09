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
        const response = await fetch('/static/buyers_data.json');
        const data = await response.json();
        
        // Collect all orders from buyers
        currentOrders = [];
        Object.entries(data.buyers || {}).forEach(([phone, buyer]) => {
            if (buyer.orders) {
                buyer.orders.forEach(order => {
                    currentOrders.push({
                        ...order,
                        customer_name: buyer.name,
                        customer_phone: phone
                    });
                });
            }
        });
        
        // Sort by date (most recent first)
        currentOrders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
        
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
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No orders found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.order_id}</td>
            <td>${order.customer_name}</td>
            <td>${order.customer_phone}</td>
            <td>${getOrderItemsSummary(order.items)}</td>
            <td><strong>₹${order.total_amount.toFixed(2)}</strong></td>
            <td><span class="status-badge status-${order.payment_status || 'pending'}">${order.payment_status || 'pending'}</span></td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>${formatDate(order.order_date)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewOrder('${order.order_id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-success btn-sm" onclick="openStatusModal('${order.order_id}')">
                    <i class="fas fa-edit"></i> Update
                </button>
            </td>
        </tr>
    `).join('');
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
        : currentOrders.filter(order => order.status === status);
    
    displayOrders(filteredOrders);
}

// Update Order Stats
function updateOrderStats() {
    const pendingCount = currentOrders.filter(o => o.status === 'pending').length;
    const confirmedCount = currentOrders.filter(o => o.status === 'confirmed').length;
    const deliveredCount = currentOrders.filter(o => o.status === 'delivered').length;
    
    document.getElementById('pending-count').textContent = pendingCount;
    document.getElementById('confirmed-count').textContent = confirmedCount;
    document.getElementById('delivered-count').textContent = deliveredCount;
}

// Get Order Items Summary
function getOrderItemsSummary(items) {
    if (!items || items.length === 0) return 'No items';
    
    if (items.length === 1) {
        return `${items[0].product_name} (${items[0].quantity})`;
    }
    
    return `${items[0].product_name} +${items.length - 1} more`;
}

// View Order Details
async function viewOrder(orderId) {
    const order = currentOrders.find(o => o.order_id === orderId);
    if (!order) return;
    
    const detailsDiv = document.getElementById('order-details');
    detailsDiv.innerHTML = `
        <div class="info-display">
            <div class="info-item">
                <div class="info-label">Order ID:</div>
                <div class="info-value">#${order.order_id}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Customer:</div>
                <div class="info-value">${order.customer_name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Phone:</div>
                <div class="info-value">${order.customer_phone}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Order Status:</div>
                <div class="info-value"><span class="status-badge status-${order.status}">${order.status}</span></div>
            </div>
            <div class="info-item">
                <div class="info-label">Payment Status:</div>
                <div class="info-value"><span class="status-badge status-${order.payment_status || 'pending'}">${order.payment_status || 'pending'}</span></div>
            </div>
            <div class="info-item">
                <div class="info-label">Order Date:</div>
                <div class="info-value">${formatDate(order.order_date)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Total Amount:</div>
                <div class="info-value"><strong>₹${order.total_amount.toFixed(2)}</strong></div>
            </div>
        </div>
        
        <div class="order-items">
            <h3>Order Items</h3>
            ${order.items.map(item => `
                <div class="order-item">
                    <div>
                        <strong>${item.product_name}</strong><br>
                        <small>Quantity: ${item.quantity} × ₹${item.price.toFixed(2)}</small>
                    </div>
                    <div><strong>₹${(item.quantity * item.price).toFixed(2)}</strong></div>
                </div>
            `).join('')}
        </div>
        
        ${order.delivery_address ? `
        <div class="info-display" style="margin-top: 1.5rem;">
            <div class="info-item">
                <div class="info-label">Delivery Address:</div>
                <div class="info-value">${order.delivery_address}</div>
            </div>
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
    const order = currentOrders.find(o => o.order_id === orderId);
    if (!order) return;
    
    document.getElementById('status-order-id').value = orderId;
    document.getElementById('order-status').value = order.status;
    document.getElementById('payment-status').value = order.payment_status || 'pending';
    
    document.getElementById('status-modal').classList.add('active');
}

// Close Status Modal
function closeStatusModal() {
    document.getElementById('status-modal').classList.remove('active');
}

// Update Order Status
async function updateOrderStatus(e) {
    e.preventDefault();
    
    const orderId = document.getElementById('status-order-id').value;
    const newOrderStatus = document.getElementById('order-status').value;
    const newPaymentStatus = document.getElementById('payment-status').value;
    
    try {
        const response = await fetch('/static/buyers_data.json');
        const data = await response.json();
        
        // Find and update the order
        let updated = false;
        Object.entries(data.buyers || {}).forEach(([phone, buyer]) => {
            if (buyer.orders) {
                const orderIndex = buyer.orders.findIndex(o => o.order_id === orderId);
                if (orderIndex !== -1) {
                    buyer.orders[orderIndex].status = newOrderStatus;
                    buyer.orders[orderIndex].payment_status = newPaymentStatus;
                    updated = true;
                }
            }
        });
        
        if (updated) {
            showNotification('Order status updated successfully!', 'success');
            closeStatusModal();
            
            // Reload orders
            await loadOrders();
            filterOrders(currentFilter);
            
            console.log('Updated buyers data:', data);
        } else {
            showNotification('Order not found', 'error');
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
