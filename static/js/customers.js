// Customers Management JavaScript
let currentCustomers = [];

document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
});

// Load Customers
async function loadCustomers() {
    try {
        const response = await fetch('/static/sample_data.json');
        const data = await response.json();
        
        // Extract unique customers from orders
        const customerMap = new Map();
        
        data.orders.forEach(order => {
            const name = order.buyer_name;
            const address = order.delivery_address;
            
            if (!customerMap.has(name)) {
                customerMap.set(name, {
                    name: name,
                    phone: address, // Using address as identifier since no phone
                    totalOrders: 0,
                    totalSpent: 0,
                    lastOrder: null,
                    joinedDate: order.created_at,
                    orders: []
                });
            }
            
            const customer = customerMap.get(name);
            customer.totalOrders++;
            
            if (order.order_status !== 'Cancelled') {
                customer.totalSpent += order.amount || 0;
            }
            
            customer.orders.push(order);
            
            // Update last order date
            if (!customer.lastOrder || new Date(order.created_at) > new Date(customer.lastOrder)) {
                customer.lastOrder = order.created_at;
            }
            
            // Update joined date (earliest order)
            if (new Date(order.created_at) < new Date(customer.joinedDate)) {
                customer.joinedDate = order.created_at;
            }
        });
        
        currentCustomers = Array.from(customerMap.values());
        
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
function viewCustomer(identifier) {
    const customer = currentCustomers.find(c => c.phone === identifier || c.name === identifier);
    if (!customer) return;
    
    const detailsDiv = document.getElementById('customer-details');
    detailsDiv.innerHTML = `
        <div class="info-display">
            <div class="info-item">
                <div class="info-label">Customer Name:</div>
                <div class="info-value"><strong>${customer.name}</strong></div>
            </div>
            <div class="info-item">
                <div class="info-label">Delivery Address:</div>
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
            ${customer.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(order => `
                <div class="order-item">
                    <div>
                        <strong>Order #${order.id}</strong><br>
                        <small>${formatDate(order.created_at)}</small><br>
                        <small>${order.product_name}${order.quantity ? ` (x${order.quantity})` : ''}</small><br>
                        <span class="status-badge status-${getStatusClass(order.order_status)}">${order.order_status}</span>
                    </div>
                    <div>
                        <strong>₹${order.amount.toFixed(2)}</strong>
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
