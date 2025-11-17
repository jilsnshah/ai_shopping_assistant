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

// Load orders by status
async function loadOrders(status) {
    const tableBody = status === 'Received' 
        ? document.getElementById('receivedOrdersBody')
        : document.getElementById('deliverOrdersBody');
    
    if (!tableBody) return;
    
    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="7" class="loading-cell">Loading orders...</td></tr>';
    
    try {
        const sellerId = 1; // Always use seller_id 1 by default
        const response = await fetch(`/api/orders?seller_id=${sellerId}&status=${encodeURIComponent(status)}`);
        const data = await response.json();
        
        if (response.ok) {
            if (data.orders && data.orders.length > 0) {
                tableBody.innerHTML = '';
                data.orders.forEach(order => {
                    const row = createOrderRow(order);
                    tableBody.appendChild(row);
                });
            } else {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="empty-cell">
                            No ${status.toLowerCase()} orders yet.
                        </td>
                    </tr>
                `;
            }
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-cell">
                        Error loading orders: ${data.error}
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-cell">
                    Error: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Create order table row
function createOrderRow(order) {
    const row = document.createElement('tr');
    
    const paymentStatusClass = order.payment_status === 'Verified' 
        ? 'status-verified' 
        : 'status-pending';
    
    row.innerHTML = `
        <td>#${order.id}</td>
        <td>${escapeHtml(order.product_name)}</td>
        <td>${escapeHtml(order.buyer_name)}</td>
        <td>${escapeHtml(order.delivery_address)}</td>
        <td>${formatCurrency(order.amount)}</td>
        <td><span class="status-badge ${paymentStatusClass}">${order.payment_status}</span></td>
        <td>${formatDate(order.created_at)}</td>
    `;
    
    return row;
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

// Load orders on page load
window.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('receivedOrdersBody')) {
        loadOrders('Received');
    }
    if (document.getElementById('deliverOrdersBody')) {
        loadOrders('To Deliver');
    }
});
