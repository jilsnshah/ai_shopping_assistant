// Company Information JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadCompanyInfo();
    
    document.getElementById('company-form').addEventListener('submit', saveCompanyInfo);
});

// Load Company Information
async function loadCompanyInfo() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        // Use company_info from new structure
        const company = data.company_info || {};
        
        if (company) {
            // Populate form fields
            document.getElementById('company-name').value = company.company_name || '';
            document.getElementById('email').value = company.email || '';
            document.getElementById('phone').value = company.phone || '';
            document.getElementById('address').value = company.address || '';
            document.getElementById('city').value = '';
            document.getElementById('state').value = '';
            document.getElementById('pincode').value = '';
            document.getElementById('country').value = 'India';
            document.getElementById('upi-id').value = company.upi_id || '';
            document.getElementById('description').value = company.company_description || '';
            
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
    
    const companyName = company.name || company.company_name;
    if (!companyName) {
        displayDiv.style.display = 'none';
        return;
    }
    
    displayDiv.style.display = 'block';
    infoDiv.innerHTML = `
        <div class="info-item">
            <div class="info-label"><i class="fas fa-store"></i> Company Name:</div>
            <div class="info-value">${companyName}</div>
        </div>
        ${company.email ? `<div class="info-item">
            <div class="info-label"><i class="fas fa-envelope"></i> Email:</div>
            <div class="info-value">${company.email}</div>
        </div>` : ''}
        ${company.phone ? `<div class="info-item">
            <div class="info-label"><i class="fas fa-phone"></i> Phone:</div>
            <div class="info-value">${company.phone}</div>
        </div>` : ''}
        ${company.address ? `<div class="info-item">
            <div class="info-label"><i class="fas fa-map-marker-alt"></i> Address:</div>
            <div class="info-value">${company.address}</div>
        </div>` : ''}
        ${company.city ? `<div class="info-item">
            <div class="info-label"><i class="fas fa-city"></i> City:</div>
            <div class="info-value">${company.city}</div>
        </div>` : ''}
        ${company.state ? `<div class="info-item">
            <div class="info-label"><i class="fas fa-map"></i> State:</div>
            <div class="info-value">${company.state}</div>
        </div>` : ''}
        ${company.pincode ? `<div class="info-item">
            <div class="info-label"><i class="fas fa-mail-bulk"></i> Pincode:</div>
            <div class="info-value">${company.pincode}</div>
        </div>` : ''}
        ${company.country ? `<div class="info-item">
            <div class="info-label"><i class="fas fa-flag"></i> Country:</div>
            <div class="info-value">${company.country}</div>
        </div>` : ''}
        ${company.upi_id ? `<div class="info-item">
            <div class="info-label"><i class="fas fa-mobile-alt"></i> UPI ID:</div>
            <div class="info-value">${company.upi_id}</div>
        </div>` : ''}
        ${(company.description || company.company_description) ? `
        <div class="info-item">
            <div class="info-label"><i class="fas fa-align-left"></i> Description:</div>
            <div class="info-value">${company.description || company.company_description}</div>
        </div>
        ` : ''}
    `;
}

// Save Company Information
async function saveCompanyInfo(e) {
    e.preventDefault();
    
    const companyData = {
        company_name: document.getElementById('company-name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        pincode: document.getElementById('pincode').value,
        country: document.getElementById('country').value,
        upi_id: document.getElementById('upi-id').value,
        company_description: document.getElementById('description').value
    };
    
    try {
        const response = await fetch('/api/company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(companyData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Company information saved successfully!', 'success');
            displayCompanyInfo(companyData);
        } else {
            showNotification(result.error || 'Error saving company information', 'error');
        }
        
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
