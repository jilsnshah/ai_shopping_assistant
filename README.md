# AI Shopping Assistant Platform - MVP

A comprehensive AI-powered shopping assistant platform that allows sellers to register their business, add products, manage orders, and track payments with a clean web interface.

## Features

### 🏪 Business Management
✅ **Business Registration**: Register with company name and description  
✅ **Product Management**: Add products with title, description, price, and image upload  
✅ **Product Gallery**: View all your products in a responsive grid layout  
✅ **Image Upload**: Support for PNG, JPG, JPEG, GIF, and WEBP images (up to 16MB)  

### 📦 Order Management
✅ **Orders Received**: View all incoming orders with buyer details  
✅ **Orders to Deliver**: Track orders ready for delivery  
✅ **Order Details**: Product name, buyer name, delivery address, payment status  
✅ **Real-time Updates**: Refresh orders with a single click  

### 💳 Payment Management
✅ **UPI Integration**: Store your UPI ID for payment collection  
✅ **Payment Tracking**: Separate views for pending and verified payments  
✅ **Payment Summary**: Visual dashboard showing total verified and pending amounts  
✅ **Manual Verification**: Mark orders as paid with one click  

### 🎨 User Experience
✅ **AJAX Form Submissions**: No page reloads - smooth user experience  
✅ **Responsive Design**: Works on desktop, tablet, and mobile devices  
✅ **Clean UI**: Modern card-based layout with intuitive navigation  
✅ **AI Assistant Placeholder**: Ready-to-implement AI activation button  

## Tech Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Custom responsive styling with flexbox and grid
- **JavaScript (Vanilla)**: AJAX requests, form validation, dynamic content

### Backend
- **Flask**: Python web framework
- **SQLite**: Lightweight database for data persistence
- **Werkzeug**: File upload handling

## Project Structure

```
ai-shopping-assist/
├── app.py                      # Flask application with all routes
├── requirements.txt            # Python dependencies
├── templates/
│   ├── base.html              # Base template with navigation
│   ├── index.html             # Home page with registration & products
│   ├── delivery_orders.html   # Orders management page
│   └── payments.html          # Payments management page
├── static/
│   ├── css/
│   │   └── style.css          # All styling
│   ├── js/
│   │   ├── script.js          # Main page JavaScript
│   │   ├── orders.js          # Orders page JavaScript
│   │   └── payments.js        # Payments page JavaScript
│   └── uploads/               # Product images (auto-created)
└── data/
    └── shopping_assistant.db  # SQLite database (auto-created)
```

## Installation & Setup

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Step 1: Install Dependencies

```powershell
pip install -r requirements.txt
```

### Step 2: Run the Application

```powershell
python app.py
```

The application will start on `http://localhost:5000`

### Step 3: Open in Browser

Navigate to:
```
http://localhost:5000
```

## Usage Guide

### 1. Register Your Business
- Fill in the registration form with company name and description
- Click "Register Business"
- Your seller ID will be stored locally for future operations

### 2. Add Products
- Navigate to the "Add Product" section or click "Add Product" in the navigation
- Fill in product details:
  - Product Name (required)
  - Description (required)
  - Price (required, must be > 0)
  - Image (optional, max 16MB)
- Click "Add Product"
- Product will appear in "My Products" section

### 3. View Your Products
- Products automatically load on the home page
- Click "Refresh Products" to reload
- Products display in a responsive grid with images, titles, descriptions, and prices

### 4. Manage Orders
- Click "Orders" in the navigation menu
- View two sections:
  - **Orders Received**: New orders that need processing
  - **Orders to Deliver**: Orders ready for delivery
- Each order shows:
  - Order ID
  - Product name
  - Buyer name and delivery address
  - Payment status (Pending/Verified)
  - Order amount
- Click "Refresh Orders" to update the lists

### 5. Manage Payments
- Click "Payments" in the navigation menu
- **Set Up UPI ID**:
  - Enter your UPI ID (e.g., yourname@paytm)
  - Click "Save UPI ID"
- **View Payment Summary**:
  - See total verified payments (green card)
  - See total pending payments (yellow card)
- **Process Pending Payments**:
  - Review pending orders in the table
  - Click "Mark as Paid" for each verified payment
  - Order moves to verified payments section
- **Track Verified Payments**:
  - View all completed transactions
  - See payment history with dates

### 6. Activate AI (Placeholder)
- Return to home page
- Click "Activate AI Assistant" button
- Currently shows a placeholder message
- Ready for AI integration in future versions

## API Endpoints

### Business Registration
**POST `/register`**
```json
{
  "company_name": "My Store",
  "company_description": "A sample electronics store"
}
```

### Product Management
**POST `/add_product`** (multipart/form-data)
```
title: Product Name
description: Product Description
price: 29.99
image: [file]
seller_id: 1
```

**GET `/products?seller_id=1`**
```json
{
  "products": [...],
  "count": 5
}
```

### Order Management
**GET `/api/orders?seller_id=1&status=Received`**
```json
{
  "orders": [
    {
      "id": 1,
      "product_name": "Wireless Headphones",
      "buyer_name": "Alice Johnson",
      "delivery_address": "456 Oak Ave",
      "payment_status": "Pending",
      "amount": 89.99
    }
  ],
  "count": 1
}
```

### Payment Management
**POST `/api/update_upi`**
```json
{
  "seller_id": 1,
  "upi_id": "yourname@paytm"
}
```

**POST `/api/mark_paid`**
```json
{
  "order_id": 1
}
```

**GET `/api/seller_info?seller_id=1`**
```json
{
  "id": 1,
  "company_name": "My Store",
  "upi_id": "yourname@paytm"
}
```

### AI Integration
**POST `/activate_ai`**
```json
{
  "message": "AI Assistant activation feature coming soon!",
  "status": "pending"
}
```

## Features in Detail

### Form Validation
- Client-side validation with HTML5 required attributes
- JavaScript validation for price and file types
- Server-side validation for all inputs
- User-friendly error messages

### Image Upload
- Secure filename handling
- File type validation (PNG, JPG, JPEG, GIF, WEBP)
- File size limit (16MB)
- Automatic timestamp to prevent filename conflicts
- Graceful fallback for products without images

### Responsive Design
- Mobile-first approach
- Breakpoints for tablets and desktops
- Flexible grid layout for products
- Touch-friendly navigation

### Data Persistence
- SQLite database with relational tables
- Automatic database initialization
- Sample data included for testing
- Transaction support for data integrity

## Sample Data

The application comes pre-loaded with sample data including:
- 1 demo seller account
- 5 sample products (electronics)
- 6 sample orders with various statuses
- Mix of pending and verified payments

This allows you to test all features immediately without manual data entry.

## Future Enhancements

- 🔐 User authentication and multi-seller support
- 🗄️ Migration to PostgreSQL for production
- 🤖 AI chatbot integration for customer support
- 📊 Analytics dashboard with sales charts
- 🛒 Customer-facing storefront
- 💳 Real payment gateway integration (Stripe, PayPal)
- 🔍 Advanced search and filter functionality
- 📧 Automated email notifications
- 📱 Mobile app (React Native)
- 🌐 Multi-language and multi-currency support
- 📦 Shipping label generation
- 📈 Inventory management and alerts

## Troubleshooting

### Port Already in Use
If port 5000 is already in use, edit `app.py` line 140:
```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Change to 5001 or any available port
```

### Images Not Uploading
- Check `static/uploads/` folder exists and has write permissions
- Verify file size is under 16MB
- Ensure file format is supported

### Forms Not Submitting
- Check browser console for JavaScript errors
- Ensure Flask server is running
- Verify network requests in browser DevTools

## License

This is an MVP project for demonstration purposes.

## Support

For issues or questions, please check the troubleshooting section or review the code comments.

---

**Built with ❤️ for sellers who want to leverage AI in e-commerce**
