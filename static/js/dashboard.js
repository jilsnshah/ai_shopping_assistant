// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardStats();
    loadRecentOrders();
});

// Load Dashboard Statistics
async function loadDashboardStats() {
    try {
        // Load sample data
        const response = await fetch('/static/sellers_data.json');
        const data = await response.json();
        
        // Calculate stats
        const totalProducts = data.products.length;
        const totalOrders = data.orders.length;
        
        // Calculate revenue from orders (exclude cancelled if status exists)
        let totalRevenue = 0;
        data.orders.forEach(order => {
            if (order.order_status !== 'Cancelled') {
                totalRevenue += order.amount || 0;
            }
        });
        
        // Get unique customers from orders
        const uniqueCustomers = new Set(data.orders.map(o => o.buyer_name));
        const totalCustomers = uniqueCustomers.size;
        
        // Update UI
        document.getElementById('total-orders').textContent = totalOrders;
        document.getElementById('total-revenue').textContent = `₹${totalRevenue.toFixed(2)}`;
        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('total-customers').textContent = totalCustomers;
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load Recent Orders
async function loadRecentOrders() {
    try {
        const response = await fetch('/static/sellers_data.json');
        const data = await response.json();
        
        const tableBody = document.getElementById('recent-orders-table');
        const allOrders = data.orders || [];
        
        // Sort by date (most recent first)
        allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Show only 5 most recent
        const recentOrders = allOrders.slice(0, 5);
        
        if (recentOrders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No orders found</td></tr>';
            return;
        }
        
        tableBody.innerHTML = recentOrders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.buyer_name}</td>
                <td>${order.delivery_address ? order.delivery_address.substring(0, 20) + '...' : 'N/A'}</td>
                <td>₹${order.amount.toFixed(2)}</td>
                <td><span class="status-badge status-${getStatusClass(order.order_status)}">${order.order_status}</span></td>
                <td>${formatDate(order.created_at)}</td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading recent orders:', error);
        document.getElementById('recent-orders-table').innerHTML = 
            '<tr><td colspan="6" class="text-center">Error loading orders</td></tr>';
    }
}

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
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
