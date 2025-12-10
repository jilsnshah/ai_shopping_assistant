# AI Shopping Assistant Platform - MVP

A comprehensive AI-powered shopping assistant platform that allows sellers to register their business, add products, manage orders, and track payments with a clean web interface. Features persistent conversation memory using Google Cloud SQL.

## 🌟 Key Features

### 🏪 Business Management
✅ **Business Registration**: Register with company name and description  
✅ **Product Management**: Add products with title, description, price, and image upload  
✅ **Product Gallery**: View all your products in a responsive grid layout  
✅ **Image Upload**: Support for PNG, JPG, JPEG, GIF, and WEBP images (up to 16MB)  

### 📦 Order Management
✅ **Multi-Item Orders**: Support for shopping cart with multiple products per order  
✅ **Order Tracking**: View all incoming orders with buyer details and items  
✅ **Real-time Updates**: Refresh orders with a single click  
✅ **Order History**: Complete order history with payment and delivery status  

### 💬 AI Assistant
✅ **Conversational Shopping**: Natural language interaction via WhatsApp  
✅ **Shopping Cart**: Add multiple items, modify quantities, view cart  
✅ **Persistent Memory**: Conversations survive app restarts (PostgreSQL/Cloud SQL)  
✅ **Multi-tool Agent**: 11 specialized tools for browsing, ordering, and tracking  

### 🗄️ Data Persistence
✅ **Firebase Realtime Database**: Buyer/seller data, products, orders  
✅ **PostgreSQL (Cloud SQL)**: LangGraph conversation memory  
✅ **Automatic Fallback**: JSON file fallback if cloud services unavailable  

### 💳 Payment Management
✅ **UPI Integration**: Store your UPI ID for payment collection  
✅ **Payment Tracking**: Separate views for pending and verified payments  
✅ **Payment Summary**: Visual dashboard showing total verified and pending amounts  

## 🛠️ Tech Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Custom responsive styling with flexbox and grid
- **JavaScript (Vanilla)**: AJAX requests, form validation, dynamic content

### Backend
- **Flask**: Python web framework
- **Firebase Realtime Database**: Buyer/seller data storage
- **Google Cloud SQL (PostgreSQL)**: Conversation memory persistence
- **LangGraph + LangChain**: AI agent orchestration
- **Gemini 2.5 Flash**: Language model for AI assistant

### AI & Memory
- **LangGraph**: Agent framework with persistent checkpointing
- **PostgresSaver**: PostgreSQL-backed conversation memory
- **InMemorySaver**: Fallback for development/testing
- **Message Trimming**: Automatic context window management

## 📁 Project Structure

```
ai-shopping-assist/
├── app.py                          # Flask application with all routes
├── multi_agent_system.py           # LangGraph AI agent with PostgreSQL memory
├── postgres_checkpointer.py        # PostgreSQL checkpointer configuration
├── firebase_db.py                  # Firebase Realtime Database integration
├── tools.py                        # 11 AI agent tools (cart, orders, products)
├── whatsapp_msg.py                 # WhatsApp Business API integration
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variable template
├── firebase-credentials.json       # Firebase service account key (gitignored)
├── GOOGLE_CLOUD_SQL_SETUP.md      # Detailed Cloud SQL setup guide
├── templates/
│   ├── base.html                  # Base template with navigation
│   ├── index.html             # Home page with registration & products
│   ├── delivery_orders.html   # Orders management page
│   └── payments.html          # Payments management page
├── static/
│   ├── css/
│   │   └── style.css          # All styling
│   ├── js/
│   │   ├── script.js          # Main page JavaScript
│   │   ├── orders.js          # Orders page JavaScript
│   │   ├── orders.js              # Orders page JavaScript
│   │   ├── customers.js           # Customers page JavaScript
│   │   └── products.js            # Products page JavaScript
│   └── uploads/                   # Product images (auto-created)
└── data/
    └── sellers_data.json          # Seller data (backup/fallback)
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.9 or higher
- Google Cloud account (free tier available)
- Firebase project (free tier available)
- Gemini API key (free tier available)

### Quick Start

1. **Clone Repository**
   ```bash
   git clone https://github.com/jilsnshah/ai_shopping_assistant.git
   cd ai_shopping_assistant
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Set Up Firebase** (Required for buyer/seller data)
   - Download `firebase-credentials.json` from Firebase Console
   - Place in project root directory

5. **Set Up Google Cloud SQL** (Required for conversation memory)
   - Follow detailed guide: [GOOGLE_CLOUD_SQL_SETUP.md](GOOGLE_CLOUD_SQL_SETUP.md)
   - Quick version:
     ```bash
     # Create instance
     gcloud sql instances create langgraph-db \
       --database-version=POSTGRES_15 \
       --tier=db-f1-micro \
       --region=us-central1
     
     # Create database
     gcloud sql databases create langgraph --instance=langgraph-db
     
     # Get connection string and update .env
     ```

6. **Test Database Connection**
   ```bash
   python postgres_checkpointer.py
   ```

7. **Run Application**
   ```bash
   python app.py
   ```

8. **Access Dashboard**
   - Open browser: `http://localhost:5000`
   - Admin dashboard for managing products and orders

9. **Test WhatsApp Integration** (Optional)
   ```bash
   python whatsapp_msg.py
   ```

## 📖 Detailed Setup Guides

### Google Cloud SQL Setup
See [GOOGLE_CLOUD_SQL_SETUP.md](GOOGLE_CLOUD_SQL_SETUP.md) for:
- Step-by-step Cloud SQL instance creation
- Database and user setup
- IP authorization
- Connection string configuration
- Pricing details (free tier available!)
- Troubleshooting guide

### Firebase Setup
1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Enable Realtime Database
3. Download service account key (Project Settings → Service Accounts)
4. Save as `firebase-credentials.json` in project root
5. Update database URL in `.env`

### Gemini API Setup
1. Get API key: [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add to `.env`: `GEMINI_API_KEY=your_key_here`

## 💡 Usage Guide

### 1. Admin Dashboard
- Navigate to `http://localhost:5000`
- **Dashboard**: Overview of orders, revenue, products
- **Products**: Add/edit/delete products
- **Orders**: View and update order status
- **Customers**: View customer profiles and order history
- **Company**: Update business information

### 2. AI Shopping Assistant (WhatsApp)
**Customer Flow:**
1. Customer sends message via WhatsApp
2. AI greets and offers assistance
3. Customer browses products: "Show me your products"
4. Customer adds to cart: "Add 2 apples"
5. Customer adds more: "Also add 5 oranges"
6. Customer views cart: "What's in my cart?"
7. Customer checks out: "I want to order"
8. AI asks for delivery address and location
9. Order placed, cart cleared automatically

**AI Agent Capabilities:**
- Browse product catalog
- Get product details
- Calculate prices
- Add items to cart
- View/modify shopping cart
- Place orders (multi-item)
- Track order history
- Update customer name
- Persistent conversation memory

### 3. Order Management
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
