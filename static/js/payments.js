// Payments Management JavaScript
let currentOrders = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    loadPayments();
    
    document.getElementById('payment-form').addEventListener('submit', updatePaymentStatus);
});

// Load Payments (Orders with payment info)
async function loadPayments() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        currentOrders = data.orders || [];
        
        // Sort by date (most recent first)
        currentOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        displayPayments(currentOrders);
        updatePaymentStats();
    } catch (error) {
        console.error('Error loading payments:', error);
        document.getElementById('payments-table').innerHTML = 
            '<tr><td colspan="8" class="text-center">Error loading payments</td></tr>';
    }
}

// Display Payments
function displayPayments(orders) {
    const tableBody = document.getElementById('payments-table');
    
    if (!orders || orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No payments found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = orders.map(order => {
        const orderId = order.order_id || order.id;
        const totalAmount = order.total_amount || order.amount || 0;
        const paymentStatus = order.payment_status || 'Pending';
        const orderStatus = order.order_status || 'Received';
        
        return `
        <tr>
            <td><strong>#${orderId}</strong></td>
            <td>${order.buyer_name}</td>
            <td>${order.buyer_phone}</td>
            <td><strong>₹${totalAmount.toFixed(2)}</strong></td>
            <td><span class="status-badge status-${getPaymentStatusClass(paymentStatus)}">${paymentStatus}</span></td>
            <td><span class="status-badge status-${getOrderStatusClass(orderStatus)}">${orderStatus}</span></td>
            <td>${formatDate(order.created_at)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewPaymentDetails(${orderId})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-success btn-sm" onclick="openPaymentModal(${orderId})">
                    <i class="fas fa-edit"></i> Update
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// Filter Payments
function filterPayments(status) {
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
        : currentOrders.filter(order => (order.payment_status || 'Pending') === status);
    
    displayPayments(filteredOrders);
}

// Update Payment Stats
function updatePaymentStats() {
    const pendingCount = currentOrders.filter(o => (o.payment_status || 'Pending') === 'Pending').length;
    const requestedCount = currentOrders.filter(o => o.payment_status === 'Requested').length;
    const completedCount = currentOrders.filter(o => o.payment_status === 'Completed').length;
    
    // Calculate total revenue from completed payments
    const totalRevenue = currentOrders
        .filter(o => o.payment_status === 'Completed')
        .reduce((sum, o) => sum + (o.total_amount || o.amount || 0), 0);
    
    document.getElementById('pending-payments-count').textContent = pendingCount;
    document.getElementById('requested-payments-count').textContent = requestedCount;
    document.getElementById('completed-payments-count').textContent = completedCount;
    document.getElementById('total-payments-value').textContent = `₹${totalRevenue.toFixed(2)}`;
}

// Get payment status CSS class
function getPaymentStatusClass(status) {
    const statusMap = {
        'Pending': 'pending',
        'Requested': 'requested',
        'Completed': 'completed'
    };
    return statusMap[status] || 'pending';
}

// Get order status CSS class
function getOrderStatusClass(status) {
    const statusMap = {
        'Received': 'pending',
        'Confirmed': 'confirmed',
        'Ready to Deliver': 'confirmed',
        'Shipped': 'shipped',
        'Delivered': 'delivered',
        'Cancelled': 'cancelled'
    };
    return statusMap[status] || 'pending';
}

// View Payment Details
function viewPaymentDetails(orderId) {
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
    }
    
    const detailsDiv = document.getElementById('payment-details');
    detailsDiv.innerHTML = `
        <div class="info-display">
            <div class="info-item">
                <div class="info-label">Order ID:</div>
                <div class="info-value"><strong>#${actualOrderId}</strong></div>
            </div>
            <div class="info-item">
                <div class="info-label">Customer Name:</div>
                <div class="info-value">${order.buyer_name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Phone Number:</div>
                <div class="info-value">${order.buyer_phone}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Total Amount:</div>
                <div class="info-value"><strong style="color: #10b981; font-size: 1.2rem;">₹${totalAmount.toFixed(2)}</strong></div>
            </div>
            <div class="info-item">
                <div class="info-label">Payment Status:</div>
                <div class="info-value"><span class="status-badge status-${getPaymentStatusClass(order.payment_status || 'Pending')}">${order.payment_status || 'Pending'}</span></div>
            </div>
            <div class="info-item">
                <div class="info-label">Order Status:</div>
                <div class="info-value"><span class="status-badge status-${getOrderStatusClass(order.order_status || 'Received')}">${order.order_status || 'Received'}</span></div>
            </div>
            <div class="info-item">
                <div class="info-label">Order Date:</div>
                <div class="info-value">${formatDate(order.created_at)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Delivery Address:</div>
                <div class="info-value">${order.delivery_address}</div>
            </div>
            ${order.delivery_lat && order.delivery_lng ? `
            <div class="info-item">
                <div class="info-label">Location:</div>
                <div class="info-value">
                    <a href="https://www.google.com/maps?q=${order.delivery_lat},${order.delivery_lng}" 
                       target="_blank" 
                       style="color: #3b82f6; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-map-marker-alt"></i>
                        View on Google Maps
                    </a>
                    <br>
                    <small style="color: #6b7280;">${order.delivery_lat}, ${order.delivery_lng}</small>
                </div>
            </div>
            ` : ''}
        </div>
        ${itemsHTML}
    `;
    
    document.getElementById('payment-details-modal').style.display = 'flex';
}

// Open Payment Modal
function openPaymentModal(orderId) {
    const order = currentOrders.find(o => (o.order_id || o.id) === orderId);
    if (!order) return;
    
    document.getElementById('payment-order-id').value = order.order_id || order.id;
    document.getElementById('payment-status').value = order.payment_status || 'Pending';
    document.getElementById('payment-notes').value = '';
    
    document.getElementById('payment-modal').style.display = 'flex';
}

// Close Payment Modal
function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
    document.getElementById('payment-form').reset();
}

// Close Payment Details Modal
function closePaymentDetailsModal() {
    document.getElementById('payment-details-modal').style.display = 'none';
}

// Update Payment Status
async function updatePaymentStatus(e) {
    e.preventDefault();
    
    const orderId = parseInt(document.getElementById('payment-order-id').value);
    const paymentStatus = document.getElementById('payment-status').value;
    
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                payment_status: paymentStatus
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Payment status updated successfully!', 'success');
            closePaymentModal();
            loadPayments(); // Reload the payments
        } else {
            showNotification(result.error || 'Error updating payment status', 'error');
        }
    } catch (error) {
        console.error('Error updating payment status:', error);
        showNotification('Error updating payment status', 'error');
    }
}

// Format Date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
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
    notification.className = `notification notification-${type}`;
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
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const paymentModal = document.getElementById('payment-modal');
    const detailsModal = document.getElementById('payment-details-modal');
    
    if (event.target === paymentModal) {
        closePaymentModal();
    }
    if (event.target === detailsModal) {
        closePaymentDetailsModal();
    }
}
