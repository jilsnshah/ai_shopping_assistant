# Quick Start Guide - AI Shopping Assistant Platform

## 🚀 Get Started in 3 Minutes

### Step 1: Install Dependencies (30 seconds)
```powershell
pip install -r requirements.txt
```

### Step 2: Run the Application (10 seconds)
```powershell
python app.py
```

### Step 3: Open in Browser
Navigate to: **http://localhost:5000**

---

## 🎯 Testing the Platform

The application comes with **pre-loaded sample data** so you can test all features immediately!

### Default Demo Account
- **Company**: Demo Store
- **Seller ID**: 1 (stored automatically)
- **Sample Products**: 5 electronics items
- **Sample Orders**: 6 orders with various statuses

---

## 📋 Feature Walkthrough

### 1️⃣ Home Page (http://localhost:5000)
**What you'll see:**
- Business registration form
- Add product form
- Product gallery (5 sample products)
- AI Assistant activation button

**Try this:**
1. Scroll to "My Products" - you'll see 5 sample products
2. Fill the "Add Product" form and add a new product
3. Refresh to see your new product appear

---

### 2️⃣ Orders Page (http://localhost:5000/delivery_orders)
**What you'll see:**
- Orders Received (3 sample orders)
- Orders to Deliver (3 sample orders)

**Features:**
- View buyer information
- Check delivery addresses
- Monitor payment status (Pending/Verified)
- See order amounts

**Try this:**
1. Click "Orders" in the navigation
2. Check the "Orders Received" table
3. Check the "Orders to Deliver" table
4. Click "Refresh Orders" to reload

---

### 3️⃣ Payments Page (http://localhost:5000/payments)
**What you'll see:**
- Payment summary dashboard
- Pending payments table (3 orders)
- Verified payments table (3 orders)
- UPI ID setup form

**Try this:**
1. Click "Payments" in the navigation
2. Enter a UPI ID (e.g., `demo@paytm`) and save
3. Review the payment summary cards
4. Click "Mark as Paid" on any pending payment
5. Watch it move to the verified payments section
6. See the summary update automatically

---

## 🔧 Key Features to Test

### ✅ AJAX Form Submissions
- **No page reloads** - all forms submit via JavaScript
- **Real-time feedback** - success/error messages appear instantly
- **Smooth experience** - forms reset automatically after success

### ✅ Responsive Design
- Resize your browser window
- Test on mobile device (use http://YOUR_IP:5000)
- Navigation adapts to screen size

### ✅ Data Persistence
- All data saved to SQLite database (`data/shopping_assistant.db`)
- Add products, mark payments - everything persists
- Restart the server - your data is still there

### ✅ Image Upload
- Add a product with an image
- Supported: PNG, JPG, JPEG, GIF, WEBP (max 16MB)
- Images saved to `static/uploads/`

---

## 📊 Sample Data Overview

### Products (5 items)
1. Wireless Headphones - $89.99
2. Smart Watch - $149.99
3. Laptop Stand - $34.99
4. USB-C Hub - $49.99
5. Mechanical Keyboard - $119.99

### Orders (6 orders)
**Orders Received:**
1. Alice Johnson - Wireless Headphones - $89.99 (Verified)
2. Bob Smith - Smart Watch - $149.99 (Pending)
3. Frank Wilson - Wireless Headphones - $89.99 (Pending)

**Orders to Deliver:**
4. Carol White - Laptop Stand - $34.99 (Verified)
5. David Brown - USB-C Hub - $49.99 (Pending)
6. Emma Davis - Mechanical Keyboard - $119.99 (Verified)

**Payment Summary:**
- Pending: $288.98 (3 orders)
- Verified: $243.98 (3 orders)

---

## 🛠️ Common Operations

### Add a New Product
1. Go to Home page
2. Scroll to "Add New Product"
3. Fill in: Title, Description, Price
4. (Optional) Upload an image
5. Click "Add Product"
6. Product appears in "My Products"

### Process a Payment
1. Go to Payments page
2. Find an order in "Pending Payments"
3. Click "Mark as Paid"
4. Confirm the action
5. Order moves to "Verified Payments"
6. Summary updates automatically

### Register a New Business
1. Go to Home page
2. Fill "Register Your Business" form
3. Enter Company Name and Description
4. Click "Register Business"
5. New seller ID stored in browser

---

## 📱 Access from Mobile Device

1. Get your computer's IP address:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address"

2. Open on mobile:
   ```
   http://YOUR_IP:5000
   ```

---

## 🔍 Troubleshooting

### Port 5000 Already in Use
Edit `app.py` line 248:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

### Database Locked Error
- Close the application
- Delete `data/shopping_assistant.db`
- Restart - database recreates with sample data

### Images Not Uploading
- Check file size (max 16MB)
- Verify format (PNG, JPG, JPEG, GIF, WEBP)
- Ensure `static/uploads/` folder exists

### Orders/Payments Not Loading
- Check browser console (F12) for errors
- Verify seller_id is set (should be "1" for demo)
- Click "Refresh" buttons to reload data

---

## 🎓 Next Steps

1. **Explore All Pages**: Home, Orders, Payments
2. **Add Your Own Data**: Create products, simulate orders
3. **Test Payment Flow**: Mark orders as paid
4. **Customize**: Edit templates, styles, add features
5. **Extend**: Add authentication, customer portal, analytics

---

## 💡 Tips

- **Seller ID**: Currently defaults to "1" for MVP
- **Sample Data**: Automatically loaded on first run
- **Database Reset**: Delete `shopping_assistant.db` to reset all data
- **Development Mode**: Changes to Python code auto-reload
- **CSS/JS Changes**: Hard refresh browser (Ctrl+F5)

---

## 📚 File Structure Quick Reference

```
├── app.py                  # Main Flask application
├── data/
│   └── *.db               # SQLite database
├── templates/
│   ├── base.html          # Navigation & layout
│   ├── index.html         # Home page
│   ├── delivery_orders.html  # Orders page
│   └── payments.html      # Payments page
├── static/
│   ├── css/style.css      # All styling
│   ├── js/
│   │   ├── script.js      # Home page logic
│   │   ├── orders.js      # Orders page logic
│   │   └── payments.js    # Payments page logic
│   └── uploads/           # Product images
```

---

**Ready to build something amazing? Start exploring! 🚀**
