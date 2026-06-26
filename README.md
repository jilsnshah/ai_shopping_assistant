# AI Shopping Assistant Platform

> A comprehensive AI-powered e-commerce platform combining a modern React admin dashboard with an intelligent WhatsApp shopping assistant. Manage your online business with ease while providing customers with an AI-powered conversational shopping experience.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-orange.svg?logo=firebase)](https://firebase.google.com/)

## 🌟 Overview

AI Shopping Assistant Platform is a full-stack e-commerce solution that bridges traditional online store management with cutting-edge AI technology. Sellers get a beautiful, modern admin dashboard built with React, while customers enjoy an intelligent shopping assistant accessible through WhatsApp using Google's Gemini AI.

### Key Highlights

- **Modern Admin Dashboard**: React-based UI with Tailwind CSS, Framer Motion animations, and real-time updates
- **AI Shopping Assistant**: Natural language shopping through WhatsApp powered by Google Gemini 2.0 Flash
- **Payment Integration**: Razorpay payment links with automated notifications
- **Real-time Database**: Firebase Realtime Database with automatic synchronization
- **Persistent Memory**: Firebase-backed conversation history for personalized experiences
- **Google OAuth**: Secure authentication with Google Sign-In

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🎨 Modern Admin Dashboard (React)

#### 📊 Dashboard & Analytics
- Real-time order statistics and revenue tracking
- Visual charts powered by Recharts
- Product performance metrics
- Customer insights

#### 🏪 Business Management
- **Google OAuth Login**: Secure authentication with email-based user accounts
- **Onboarding Flow**: Guided setup for new sellers
- **Company Profile**: Manage business information, contact details, and social links
- **Multi-seller Support**: Each seller has their own isolated data space

#### 📦 Product Management
- Add, edit, and delete products with image upload
- Categorized product listings
- Stock quantity tracking
- Responsive product grid with search and filters

#### 🛒 Order Management
- Real-time order notifications
- Multi-item order support with shopping cart
- Order status tracking (Received → Prepared → Out for Delivery → Delivered)
- Customer details and delivery addresses
- Editable WhatsApp notification messages before sending

#### 💳 Payment Management
- **Razorpay Integration**: Automated payment link generation
- **UPI Support**: Manual UPI payment collection
- Payment status tracking (Pending → Requested → Completed)
- Invoice attachment via WhatsApp (PDF support)
- Payment summary dashboard

#### 👥 Customer Management
- Customer profiles with order history
-  Phone number and name tracking
- Purchase analytics per customer

#### 🔄 Automation (Coming Soon)
- Drag-and-drop workflow builder
- Custom order processing sequences
- Automated status updates
- Cancellation workflow rules

#### 🔌 Integrations (Coming Soon)
- Razorpay configuration panel
- WhatsApp Business API settings
- Third-party service connections

#### ❌ Cancellation & Refund (Coming Soon)
- Customer cancellation request management
- Approve/reject with custom messages
- Automatic refund warnings for paid orders
- WhatsApp notification on decision

### 🤖 AI Shopping Assistant (WhatsApp)

#### Intelligent Conversation
- Natural language understanding powered by Google Gemini 2.0 Flash
- Context-aware responses with conversation memory
- Multi-turn dialogues with intent recognition
- Fallback to company contact for complex queries

#### Shopping Capabilities
- **Product Catalog**: Browse all products with descriptions and prices
- **Search**: Find products by name or description
- **Shopping Cart**: Add/remove items, modify quantities
- **Multi-item Orders**: Place orders with multiple products
- **Order Tracking**: View order history and status
- **Profile Management**: Update customer name

#### LangGraph Agent Tools
1. `browse_products` - View product catalog
2. `get_product_details` - Detailed product information
3. `calculate_price` - Price calculation for quantities
4. `add_to_cart` - Add items to shopping cart
5. `view_cart` - Display cart contents
6. `remove_from_cart` - Remove items from cart
7. `clear_cart` - Empty shopping cart
8. `create_order` - Place order with delivery details
9. `get_my_orders` - View order history
10. `update_my_name` - Change customer name
11. `get_company_details` - Company contact information

### 🔐 Security & Data

- **Firebase Realtime Database**: Secure cloud data storage for all persistence
- **Google OAuth 2.0**: Industry-standard authentication
- **Session Management**: Secure seller sessions with Flask
- **Email-based Isolation**: Each seller's data is completely separate

## 🛠️ Tech Stack

### Frontend
- **React 18.3**: Modern UI library with hooks
- **Vite**: Lightning-fast build tool
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **React Router DOM**: Client-side routing
- **Lucide React**: Beautiful icon library
- **Recharts**: Data visualization
- **Axios**: HTTP client
- **Google OAuth**: Authentication

### Backend
- **Flask**: Python web framework
- **Firebase Admin SDK**: Realtime Database integration
- **LangGraph**: AI agent framework
- **LangChain**: LLM orchestration
- **Google Gemini 2.0 Flash**: Language model
- **Razorpay SDK**: Payment processing
- **WhatsApp Business API**: Messaging integration

### Infrastructure
- **Firebase Realtime Database**: NoSQL data storage (sellers, products, orders, conversation history)
- **Firebase Storage**: Product image hosting
- **Environment Variables**: Configuration management

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
├──────────────────┬──────────────────────────────────────────┤
│  React Dashboard │          WhatsApp Customer               │
│   (Port 5173)    │          (Meta WhatsApp)                │
└────────┬─────────┴──────────────────┬───────────────────────┘
         │                            │
         │ HTTPS/REST                 │ Webhook
         ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Flask Backend (Port 5000)                       │
├──────────────────┬──────────────────────────────────────────┤
│  API Routes      │     AI Agent System                      │
│  - Auth          │     - LangGraph                          │
│  - Products      │     - Gemini 2.0 Flash                   │
│  - Orders        │     - 11 Tools                           │
│  - Payments      │     - Memory Management                  │
│  - Cancellations │                                          │
└────────┬─────────┴──────────────────┬───────────────────────┘
         │                            │
         ▼                            ▼
┌─────────────────────┐    ┌─────────────────────────┐
│      Firebase Realtime Database                     │
│    - Sellers Data       - Conversation History      │
│    - Products           - Customer Profiles         │
│    - Orders             - WhatsApp Credentials      │
│    - Cancellations      - Razorpay Credentials      │
└─────────────────────────────────────────────────────┘
```

## 🚀 Installation

### Prerequisites

- **Python 3.9+**: [Download](https://www.python.org/downloads/)
- **Node.js 18+**: [Download](https://nodejs.org/)
- **Firebase Account**: [Create](https://console.firebase.google.com/)
- **Razorpay Account**: [Register](https://razorpay.com/) (for payments)
- **Meta WhatsApp Business**: [Setup](https://business.whatsapp.com/) (for messaging)

### Quick Start

1. **Clone Repository**
   ```bash
   git clone https://github.com/jilsnshah/ai_shopping_assistant.git
   cd ai_shopping_assistant
   ```

2. **Backend Setup**
   ```bash
   # Install Python dependencies
   pip install -r requirements.txt
   
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your credentials
   nano .env
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Firebase Configuration**
   - Create a Firebase project
   - Enable Realtime Database
   - Download service account key
   - Save as `firebase-credentials.json` in project root

5. **Run Application**
   ```bash
   # Terminal 1: Backend
   python app.py
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

7. **Access Application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Google AI
GEMINI_API_KEY=your_gemini_api_key

# Firebase
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
VERIFY_TOKEN=your_custom_verify_token

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### Frontend Configuration (frontend/.env)

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

## 💻 Usage

### Admin Dashboard

1. **Login**
   - Navigate to `http://localhost:5173/login`
   - Click "Sign in with Google"
   - Authorize access

2. **Onboarding** (First-time users)
   - Fill in company details
   - Add contact information
   - Set up payment methods

3. **Company Profile**
   - Update business information
   - Add social media links
   - Configure UPI ID

4. **Manage Products**
   - Click "Products" in sidebar
   - Add new products with images
   - Edit or delete existing products
   - Manage stock quantities

5. **Handle Orders**
   - View incoming orders
   - Update order status
   - Send custom WhatsApp notifications
   - Track delivery progress

6. **Process Payments**
   - Configure Razorpay credentials
   - Generate payment links
   - Mark payments as completed
   - Send payment requests with invoices

7. **Manage Customers**
   - View customer list
   - Check order history
   - Analyze purchase patterns

### WhatsApp Shopping Assistant

**Customer Interaction Flow:**

```
Customer: Hi
AI: Hello! 👋 Welcome! I can help you browse products and place orders.
    What would you like to do today?

Customer: Show me products
AI: Here are our available products:
    
    🍎 Fresh Apples - ₹50/kg
    Fresh red apples from Kashmir
    
    🍊 Juicy Oranges - ₹40/kg
    Sweet oranges packed with Vitamin C
    
    [... more products]

Customer: Add 2kg apples to cart
AI: Added 2kg ofFresh Apples to your cart! 🛒
    Would you like to add anything else?

Customer: What's in my cart?
AI: Your Shopping Cart 🛒:
    • Fresh Apples x 2kg - ₹100.00
    
    Total: ₹100.00
    
    Ready to checkout?

Customer: Yes, place order
AI: Great! To complete your order, I need:
    1. Delivery address
    2. Your location (latitude, longitude)
    
    What's your delivery address?

Customer: 123 Main St, Mumbai
AI: Perfect! And your location coordinates?

Customer: 19.0760, 72.8777
AI: ✅ Order placed successfully!
    
    Order #1234
    • Fresh Apples x 2kg - ₹100.00
    Total: ₹100.00
    
    Delivery: 123 Main St, Mumbai
    
    Your cart has been cleared. Seller will process your order soon!
```

## 📡 API Documentation

### Authentication

#### Google OAuth Login
```http
POST /api/auth/google
Content-Type: application/json

{
  "credential": "google_jwt_token",
  "clientId": "your_client_id"
}
```

### Company Management

#### Get Company Info
```http
GET /api/company
```

#### Update Company Info
```http
POST /api/company
Content-Type: application/json

{
  "company_name": "My Store",
  "email": "store@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "country": "India",
  "upi_id": "store@upi",
  "company_description": "Best store in town"
}
```

### Products

#### Get Products
```http
GET /api/products
```

#### Create Product
```http
POST /api/products
Content-Type: application/json

{
  "title": "Product Name",
  "description": "Product description",
  "price": 999.99,
  "category": "Electronics",
  "stock_quantity": 100,
  "image_url": "https://..."
}
```

#### Update Product
```http
PUT /api/products/{product_id}
Content-Type: application/json

{
  "title": "Updated Name",
  "price": 1099.99,
  "stock_quantity": 50
}
```

#### Delete Product
```http
DELETE /api/products/{product_id}
```

### Orders

#### Get Orders
```http
GET /api/orders?status=Received
```

#### Update Order
```http
PUT /api/orders/{order_id}
Content-Type: multipart/form-data

order_status: "Out for Delivery"
custom_message: "Your order is on the way!"
invoice: [file] (optional)
```

### Payments

#### Configure Razorpay
```http
POST /api/razorpay/credentials
Content-Type: application/json

{
  "api_key": "rzp_test_xxxxx",
  "api_secret": "your_secret"
}
```

#### Get Razorpay Status
```http
GET /api/razorpay/status
```

### Workflow Automation

#### Get Workflow Config
```http
GET /api/workflow
```

#### Save Workflow Config
```http
POST /api/workflow
Content-Type: application/json

{
  "blocks": [
    "order_created",
    "order_accepted",
    "request_payment",
    "pause_until_payment",
    "order_prepared",
    "order_out_for_delivery",
    "order_delivered"
  ]
}
```

### Cancellations

#### Get Cancellation Requests
```http
GET /api/cancellations
```

#### Approve Cancellation
```http
POST /api/cancellations/{order_id}/approve
Content-Type: application/json

{
  "message": "Your cancellation has been approved. Refund will be processed."
}
```

#### Reject Cancellation
```http
POST /api/cancellations/{order_id}/reject
Content-Type: application/json

{
  "message": "Sorry, we cannot cancel this order as it's already shipped."
}
```

## 📁 Project Structure

```
ai-shopping-assist/
├── frontend/                      # React frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js          # API client configuration
│   │   ├── components/
│   │   │   ├── Sidebar.jsx       # Navigation sidebar
│   │   │   ├── TopBar.jsx        # Header component
│   │   │   └── Toast.jsx         # Notification system
│   │   ├── hooks/
│   │   │   └── useToast.js       # Toast hook
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx  # Main layout
│   │   ├── lib/
│   │   │   └── utils.js          # Utility functions
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Analytics dashboard
│   │   │   ├── Login.jsx         # Google OAuth login
│   │   │   ├── Onboarding.jsx    # First-time setup
│   │   │   ├── Company.jsx       # Company profile
│   │   │   ├── Products.jsx      # Product management
│   │   │   ├── Orders.jsx        # Order management
│   │   │   ├── Customers.jsx     # Customer view
│   │   │   ├── Payments.jsx      # Payment tracking
│   │   │   ├── Integrations.jsx  # Coming soon
│   │   │   ├── Automation.jsx    # Coming soon
│   │   │   └── Cancellations.jsx # Coming soon
│   │   ├── App.jsx               # Main app component
│   │   ├── main.jsx              # Entry point
│   │   └── index.css             # Global styles
│   ├── package.json              # NPM dependencies
│   ├── vite.config.js            # Vite configuration
│   └── tailwind.config.js        # Tailwind CSS config
├── app.py                        # Flask backend server
├── multi_agent_system.py         # LangGraph AI agent
├── tools.py                      # AI agent tools (11 functions)
├── firebase_db.py                # Firebase integration
├── whatsapp_msg.py               # WhatsApp API client
├── razorpay_helper.py            # Razorpay integration
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment template
├── firebase-credentials.json     # Firebase service account
└── README.md                     # This file
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini for the powerful AI capabilities
- Firebase for reliable database services
- Razorpay for payment processing
- Meta for WhatsApp Business API
- The React and Python communities

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact: jilsnshah@gmail.com

---

**Built with ❤️ for modern e-commerce**
