// Company Information JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadCompanyInfo();
    
    document.getElementById('company-form').addEventListener('submit', saveCompanyInfo);
});

// Load Company Information
async function loadCompanyInfo() {
    try {
        const response = await fetch('/static/sample_data.json');
        const data = await response.json();
        const company = data.company_info;
        
        if (company) {
            // Populate form fields
            document.getElementById('company-name').value = company.name || '';
            document.getElementById('email').value = company.email || '';
            document.getElementById('phone').value = company.phone || '';
            document.getElementById('address').value = company.address || '';
            document.getElementById('city').value = company.city || '';
            document.getElementById('state').value = company.state || '';
            document.getElementById('pincode').value = company.pincode || '';
            document.getElementById('country').value = company.country || 'India';
            document.getElementById('description').value = company.description || '';
            
            // Display current info
            displayCompanyInfo(company);
        }
    } catch (error) {
        console.error('Error loading company info:', error);
        showNotification('Error loading company information', 'error');
    }
}

// Display Company Information
function displayCompanyInfo(company) {
    const displayDiv = document.getElementById('company-display');
    const infoDiv = document.getElementById('company-info');
    
    if (!company.name) {
        displayDiv.style.display = 'none';
        return;
    }
    
    displayDiv.style.display = 'block';
    infoDiv.innerHTML = `
        <div class="info-item">
            <div class="info-label"><i class="fas fa-store"></i> Company Name:</div>
            <div class="info-value">${company.name}</div>
        </div>
        <div class="info-item">
            <div class="info-label"><i class="fas fa-envelope"></i> Email:</div>
            <div class="info-value">${company.email}</div>
        </div>
        <div class="info-item">
            <div class="info-label"><i class="fas fa-phone"></i> Phone:</div>
            <div class="info-value">${company.phone}</div>
        </div>
        <div class="info-item">
            <div class="info-label"><i class="fas fa-map-marker-alt"></i> Address:</div>
            <div class="info-value">${company.address}</div>
        </div>
        <div class="info-item">
            <div class="info-label"><i class="fas fa-city"></i> City:</div>
            <div class="info-value">${company.city}</div>
        </div>
        <div class="info-item">
            <div class="info-label"><i class="fas fa-map"></i> State:</div>
            <div class="info-value">${company.state}</div>
        </div>
        <div class="info-item">
            <div class="info-label"><i class="fas fa-mail-bulk"></i> Pincode:</div>
            <div class="info-value">${company.pincode}</div>
        </div>
        <div class="info-item">
            <div class="info-label"><i class="fas fa-flag"></i> Country:</div>
            <div class="info-value">${company.country}</div>
        </div>
        ${company.description ? `
        <div class="info-item">
            <div class="info-label"><i class="fas fa-align-left"></i> Description:</div>
            <div class="info-value">${company.description}</div>
        </div>
        ` : ''}
    `;
}

// Save Company Information
async function saveCompanyInfo(e) {
    e.preventDefault();
    
    const companyData = {
        name: document.getElementById('company-name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        pincode: document.getElementById('pincode').value,
        country: document.getElementById('country').value,
        description: document.getElementById('description').value
    };
    
    try {
        // Load existing data
        const response = await fetch('/static/sample_data.json');
        const data = await response.json();
        
        // Update company info
        data.company_info = companyData;
        
        // In a real application, this would be a POST request to the server
        // For now, we'll just show a success message and update the display
        console.log('Company data to save:', data);
        
        showNotification('Company information saved successfully!', 'success');
        displayCompanyInfo(companyData);
        
        // Note: To actually save, you need to implement a backend endpoint
        // Example:
        // await fetch('/api/company', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(data)
        // });
        
    } catch (error) {
        console.error('Error saving company info:', error);
        showNotification('Error saving company information', 'error');
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    // Create notification element
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
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
