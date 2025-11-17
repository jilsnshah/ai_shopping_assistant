// Utility function to show messages
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        messageElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    }
}

// Format currency
function formatCurrency(amount) {
    return `$${parseFloat(amount).toFixed(2)}`;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
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
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Load seller info and UPI ID
async function loadSellerInfo() {
    try {
        const sellerId = 1; // Always use seller_id 1 by default
        const response = await fetch(`/api/seller_info?seller_id=${sellerId}`);
        const data = await response.json();
        
        if (response.ok && data.upi_id) {
            document.getElementById('upi_id').value = data.upi_id;
        }
    } catch (error) {
        console.error('Error loading seller info:', error);
    }
}

// UPI Form Handler
const upiForm = document.getElementById('upiForm');
if (upiForm) {
    upiForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const upiId = document.getElementById('upi_id').value;
        const sellerId = 1; // Always use seller_id 1 by default
        
        try {
            const response = await fetch('/api/update_upi', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    seller_id: sellerId,
                    upi_id: upiId
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showMessage('upiMessage', 
                    'UPI ID saved successfully!', 
                    'success');
            } else {
                showMessage('upiMessage', 
                    `Error: ${data.error}`, 
                    'error');
            }
        } catch (error) {
            showMessage('upiMessage', 
                `Error: ${error.message}`, 
                'error');
        }
    });
}

// Load payments and update summary
async function loadPayments() {
    try {
        const sellerId = 1; // Always use seller_id 1 by default
        const response = await fetch(`/api/orders?seller_id=${sellerId}`);
        const data = await response.json();
        
        if (response.ok) {
            const pendingOrders = data.orders.filter(o => o.payment_status === 'Pending');
            const verifiedOrders = data.orders.filter(o => o.payment_status === 'Verified');
            
            // Update summary
            updatePaymentSummary(pendingOrders, verifiedOrders);
            
            // Update tables
            updatePendingPaymentsTable(pendingOrders);
            updateVerifiedPaymentsTable(verifiedOrders);
        } else {
            showMessage('paymentsMessage', 
                `Error: ${data.error}`, 
                'error');
        }
    } catch (error) {
        showMessage('paymentsMessage', 
            `Error: ${error.message}`, 
            'error');
    }
}

// Update payment summary
function updatePaymentSummary(pendingOrders, verifiedOrders) {
    const pendingAmount = pendingOrders.reduce((sum, order) => sum + order.amount, 0);
    const verifiedAmount = verifiedOrders.reduce((sum, order) => sum + order.amount, 0);
    
    document.getElementById('pendingAmount').textContent = formatCurrency(pendingAmount);
    document.getElementById('pendingCount').textContent = `${pendingOrders.length} orders`;
    
    document.getElementById('verifiedAmount').textContent = formatCurrency(verifiedAmount);
    document.getElementById('verifiedCount').textContent = `${verifiedOrders.length} orders`;
}

// Update pending payments table
function updatePendingPaymentsTable(orders) {
    const tbody = document.getElementById('pendingPaymentsBody');
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
                    No pending payments. All orders are verified!
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${escapeHtml(order.product_name)}</td>
            <td>${escapeHtml(order.buyer_name)}</td>
            <td>${formatCurrency(order.amount)}</td>
            <td>${formatDate(order.created_at)}</td>
            <td>
                <button class="btn-mark-paid" onclick="markAsPaid(${order.id})">
                    Mark as Paid
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update verified payments table
function updateVerifiedPaymentsTable(orders) {
    const tbody = document.getElementById('verifiedPaymentsBody');
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
                    No verified payments yet.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${escapeHtml(order.product_name)}</td>
            <td>${escapeHtml(order.buyer_name)}</td>
            <td>${formatCurrency(order.amount)}</td>
            <td>${formatDate(order.created_at)}</td>
            <td><span class="status-badge status-verified">Verified</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Mark order as paid
async function markAsPaid(orderId) {
    if (!confirm('Are you sure you want to mark this order as paid?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/mark_paid', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ order_id: orderId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('paymentsMessage', 
                'Order marked as paid successfully!', 
                'success');
            // Reload payments
            loadPayments();
        } else {
            showMessage('paymentsMessage', 
                `Error: ${data.error}`, 
                'error');
        }
    } catch (error) {
        showMessage('paymentsMessage', 
            `Error: ${error.message}`, 
            'error');
    }
}

// Load data on page load
window.addEventListener('DOMContentLoaded', function() {
    loadSellerInfo();
    loadPayments();
});
