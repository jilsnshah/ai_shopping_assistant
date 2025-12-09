// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardStats();
    loadRecentOrders();
});

// Load Dashboard Statistics
async function loadDashboardStats() {
    try {
        // Load sample data
        const response = await fetch('/static/sample_data.json');
        const data = await response.json();
        
        // Load buyers data
        const buyersResponse = await fetch('/static/buyers_data.json');
        const buyersData = await buyersResponse.json();
        
        // Calculate stats
        const totalProducts = data.products.length;
        const totalCustomers = Object.keys(buyersData.buyers || {}).length;
        
        let totalOrders = 0;
        let totalRevenue = 0;
        
        Object.values(buyersData.buyers || {}).forEach(buyer => {
            if (buyer.orders) {
                totalOrders += buyer.orders.length;
                buyer.orders.forEach(order => {
                    if (order.status !== 'cancelled') {
                        totalRevenue += order.total_amount || 0;
                    }
                });
            }
        });
        
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
        const response = await fetch('/static/buyers_data.json');
        const data = await response.json();
        
        const tableBody = document.getElementById('recent-orders-table');
        const allOrders = [];
        
        // Collect all orders
        Object.entries(data.buyers || {}).forEach(([phone, buyer]) => {
            if (buyer.orders) {
                buyer.orders.forEach(order => {
                    allOrders.push({
                        ...order,
                        customer_name: buyer.name,
                        customer_phone: phone
                    });
                });
            }
        });
        
        // Sort by date (most recent first)
        allOrders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
        
        // Show only 5 most recent
        const recentOrders = allOrders.slice(0, 5);
        
        if (recentOrders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No orders found</td></tr>';
            return;
        }
        
        tableBody.innerHTML = recentOrders.map(order => `
            <tr>
                <td>#${order.order_id}</td>
                <td>${order.customer_name}</td>
                <td>${order.customer_phone}</td>
                <td>₹${order.total_amount.toFixed(2)}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td>${formatDate(order.order_date)}</td>
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
