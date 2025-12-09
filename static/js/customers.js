// Customers Management JavaScript
let currentCustomers = [];

document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
});

// Load Customers
async function loadCustomers() {
    try {
        const response = await fetch('/static/buyers_data.json');
        const data = await response.json();
        
        // Transform buyers data to customers array
        currentCustomers = Object.entries(data.buyers || {}).map(([phone, buyer]) => {
            const orders = buyer.orders || [];
            const totalOrders = orders.length;
            const totalSpent = orders.reduce((sum, order) => {
                if (order.status !== 'cancelled') {
                    return sum + (order.total_amount || 0);
                }
                return sum;
            }, 0);
            
            // Get last order date
            const lastOrder = orders.length > 0 
                ? orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date))[0].order_date
                : null;
            
            return {
                name: buyer.name,
                phone: phone,
                totalOrders: totalOrders,
                totalSpent: totalSpent,
                lastOrder: lastOrder,
                joinedDate: buyer.created_at,
                orders: orders
            };
        });
        
        // Sort by total spent (highest first)
        currentCustomers.sort((a, b) => b.totalSpent - a.totalSpent);
        
        displayCustomers(currentCustomers);
        updateCustomerStats();
    } catch (error) {
        console.error('Error loading customers:', error);
        document.getElementById('customers-table').innerHTML = 
            '<tr><td colspan="7" class="text-center">Error loading customers</td></tr>';
    }
}

// Display Customers
function displayCustomers(customers) {
    const tableBody = document.getElementById('customers-table');
    
    if (customers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No customers found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = customers.map(customer => `
        <tr>
            <td><strong>${customer.name}</strong></td>
            <td>${customer.phone}</td>
            <td>${customer.totalOrders}</td>
            <td><strong>₹${customer.totalSpent.toFixed(2)}</strong></td>
            <td>${customer.lastOrder ? formatDate(customer.lastOrder) : 'No orders'}</td>
            <td>${formatDate(customer.joinedDate)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewCustomer('${customer.phone}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
            </td>
        </tr>
    `).join('');
}

// Update Customer Stats
function updateCustomerStats() {
    const totalCustomers = currentCustomers.length;
    const activeCustomers = currentCustomers.filter(c => c.totalOrders > 0).length;
    
    document.getElementById('total-customers-count').textContent = totalCustomers;
    document.getElementById('active-customers-count').textContent = activeCustomers;
}

// View Customer Details
function viewCustomer(phone) {
    const customer = currentCustomers.find(c => c.phone === phone);
    if (!customer) return;
    
    const detailsDiv = document.getElementById('customer-details');
    detailsDiv.innerHTML = `
        <div class="info-display">
            <div class="info-item">
                <div class="info-label">Customer Name:</div>
                <div class="info-value"><strong>${customer.name}</strong></div>
            </div>
            <div class="info-item">
                <div class="info-label">Phone Number:</div>
                <div class="info-value">${customer.phone}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Total Orders:</div>
                <div class="info-value">${customer.totalOrders}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Total Spent:</div>
                <div class="info-value"><strong>₹${customer.totalSpent.toFixed(2)}</strong></div>
            </div>
            <div class="info-item">
                <div class="info-label">Last Order:</div>
                <div class="info-value">${customer.lastOrder ? formatDate(customer.lastOrder) : 'No orders'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Customer Since:</div>
                <div class="info-value">${formatDate(customer.joinedDate)}</div>
            </div>
        </div>
        
        ${customer.orders.length > 0 ? `
        <div class="order-items">
            <h3>Order History</h3>
            ${customer.orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date)).map(order => `
                <div class="order-item">
                    <div>
                        <strong>Order #${order.order_id}</strong><br>
                        <small>${formatDate(order.order_date)}</small><br>
                        <span class="status-badge status-${order.status}">${order.status}</span>
                    </div>
                    <div>
                        <strong>₹${order.total_amount.toFixed(2)}</strong><br>
                        <small>${order.items.length} item(s)</small>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : '<p style="padding: 1.5rem; text-align: center; color: #6b7280;">No orders yet</p>'}
    `;
    
    document.getElementById('customer-modal').classList.add('active');
}

// Close Customer Modal
function closeCustomerModal() {
    document.getElementById('customer-modal').classList.remove('active');
}

// Format Date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const customerModal = document.getElementById('customer-modal');
    
    if (event.target === customerModal) {
        closeCustomerModal();
    }
}
