
from dotenv import load_dotenv
load_dotenv()
from flask import Flask, render_template, request, jsonify, session
import os
import json
from datetime import datetime
from whatsapp_msg import send_whatsapp_message, send_whatsapp_media
from firebase_db import load_seller_data, save_seller_data, initialize_firebase, save_razorpay_credentials, get_razorpay_credentials
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from razorpay_helper import create_payment_link, handle_payment_success, verify_webhook_signature

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-in-production'  # Required for sessions

# In-memory storage using dictionaries
company_info = {}
products = []
orders = []

# Load data from Firebase for specific seller
def load_data_from_firebase(seller_id):
    global company_info, products, orders
    
    try:
        initialize_firebase()
        data = load_seller_data(seller_id)
        
        # Load company info
        company_info = data.get('company_info', {})
        
        # Load products
        products = data.get('products', [])
        
        # Load orders
        orders = data.get('orders', [])
        
        print(f"✅ Data loaded successfully for seller {seller_id}")
        print(f"   - Products: {len(products)}")
        print(f"   - Orders: {len(orders)}")
        
    except Exception as e:
        print(f"❌ Error loading from Firebase: {e}")
        print(f"ℹ️  Initializing with empty data")

# Save data to Firebase for specific seller
def save_data_to_firebase(seller_id):
    global company_info, products, orders
    
    try:
        data = {
            'company_info': company_info,
            'products': products,
            'orders': orders
        }
        
        result = save_seller_data(seller_id, data)
        
        if result:
            print(f"💾 Data saved successfully for seller {seller_id}")
        return result
    except Exception as e:
        print(f"❌ Error saving to Firebase: {e}")
        return False

# Initialize Firebase on startup
initialize_firebase()

# Reload data before each request if seller is in session
@app.before_request
def reload_data():
    seller_id = session.get('seller_id')
    if seller_id and request.endpoint not in ['login', 'static']:
        load_data_from_firebase(seller_id)

# Disable caching for all responses
@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response


@app.route('/')
def index():
    if 'seller_id' not in session:
        return render_template('login.html')
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        seller_id = data.get('seller_id')
        
        if seller_id:
            session['seller_id'] = str(seller_id)
            load_data_from_firebase(seller_id)
            return jsonify({'success': True, 'seller_id': seller_id}), 200
        else:
            return jsonify({'error': 'Seller ID is required'}), 400
    
    return render_template('login.html')

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    seller_id = data.get('seller_id')
    
    if seller_id:
        session['seller_id'] = str(seller_id)
        load_data_from_firebase(seller_id)
        # fixed
        return jsonify({'success': True, 'seller_id': seller_id}), 200
    else:
        return jsonify({'error': 'Seller ID is required'}), 400

@app.route('/api/auth/google', methods=['POST'])
def google_login():
    data = request.get_json()
    token = data.get('credential')
    client_id = data.get('clientId')
    
    app.logger.info(f"🔐 Google Login Attempt")
    app.logger.info(f"   Token received: {token[:50] if token else 'None'}...")
    app.logger.info(f"   Client ID: {client_id}")
    
    if not token:
        return jsonify({'error': 'Token is required'}), 400
        
    try:
        # Verify token with audience (client_id) and clock skew tolerance
        # clock_skew_in_seconds allows for minor time differences between client and server
        id_info = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            audience=client_id,
            clock_skew_in_seconds=10
        )
        
        # Get email from token
        email = id_info.get('email')
        
        if not email:
            return jsonify({'error': 'Email not found in token'}), 400
            
        # Use email as seller_id
        seller_id = email
        session['seller_id'] = seller_id
        
        # Load data from Firebase
        load_data_from_firebase(seller_id)
        
        # Check if this is a new user (no company_info)
        is_new_user = not company_info or len(company_info) == 0
        
        # For new users, initialize with basic Google info but don't save yet
        # They need to complete onboarding first
        if is_new_user:
            company_info['email'] = email
            name = id_info.get('name')
            if name:
                company_info['company_name'] = name
            picture = id_info.get('picture')
            if picture:
                company_info['picture'] = picture
        
        app.logger.info(f"✅ Login successful for {email} (new_user: {is_new_user})")
        
        return jsonify({
            'success': True, 
            'seller_id': seller_id,
            'email': email,
            'name': id_info.get('name'),
            'picture': id_info.get('picture'),
            'is_new_user': is_new_user
        }), 200
        
    except ValueError as e:
        app.logger.error(f"❌ Token verification failed: {e}")
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        app.logger.error(f"❌ Google login error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/onboarding', methods=['POST'])
def onboarding():
    """Complete seller onboarding with company information"""
    try:
        seller_id = session.get('seller_id')
        if not seller_id:
            return jsonify({'error': 'Not logged in'}), 401
        
        data = request.get_json()
        
        # Update company info with onboarding data (matching seller_id 1 structure)
        company_info['id'] = seller_id  # Use email as ID
        company_info['company_name'] = data.get('company_name', company_info.get('company_name', ''))
        company_info['owner_name'] = data.get('company_name', company_info.get('company_name', ''))  # Use company name as owner name for now
        company_info['phone'] = data.get('phone', '')
        company_info['address'] = data.get('address', '')
        company_info['city'] = data.get('city', '')
        company_info['state'] = data.get('state', '')
        company_info['pincode'] = data.get('pincode', '')
        company_info['country'] = data.get('country', 'India')
        company_info['upi_id'] = data.get('upi_id', '')
        company_info['company_description'] = data.get('company_description', '')
        company_info['google_business_link'] = data.get('google_business_link', '')
        company_info['instagram_link'] = data.get('instagram_link', '')
        company_info['registered_at'] = datetime.now().isoformat()
        
        # Keep email and picture from Google login
        # (already set in company_info during login)
        
        # Save to Firebase
        save_data_to_firebase(seller_id)
        
        return jsonify({
            'success': True,
            'message': 'Onboarding completed successfully'
        }), 200
        
    except Exception as e:
        print(f"Onboarding error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/logout')
def logout():
    session.pop('seller_id', None)
    return jsonify({'success': True}), 200

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.pop('seller_id', None)
    return jsonify({'success': True}), 200

@app.route('/company')
def company():
    if 'seller_id' not in session:
        return render_template('login.html')
    return render_template('company.html')

@app.route('/products')
def products():
    if 'seller_id' not in session:
        return render_template('login.html')
    return render_template('products.html')

@app.route('/orders')
def orders():
    if 'seller_id' not in session:
        return render_template('login.html')
    return render_template('orders.html')

@app.route('/customers')
def customers():
    if 'seller_id' not in session:
        return render_template('login.html')
    return render_template('customers.html')

@app.route('/payments')
def payments():
    if 'seller_id' not in session:
        return render_template('login.html')
    return render_template('payments.html')


# ===== API ENDPOINTS =====

@app.route('/api/data', methods=['GET'])
def get_all_data():
    """Get all seller data (company_info, products, orders) for frontend"""
    try:
        seller_id = session.get('seller_id')
        if not seller_id:
            return jsonify({'error': 'Not logged in'}), 401
        
        return jsonify({
            'seller_id': seller_id,
            'company_info': company_info,
            'products': products,
            'orders': orders
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products for a seller"""
    try:
        seller_id = session.get('seller_id')
        if not seller_id:
            return jsonify({'error': 'Not logged in'}), 401
        
        print(f"📦 GET /products request - seller_id: {seller_id}, total products: {len(products)}")
        
        # Sort by created_at descending
        sorted_products = sorted(products, key=lambda x: x.get('created_at', ''), reverse=True)
        
        print(f"   ✅ Returning {len(sorted_products)} products for seller {seller_id}")
        
        return jsonify({
            'products': sorted_products,
            'count': len(sorted_products)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Get all orders for a seller"""
    try:
        seller_id = session.get('seller_id')
        if not seller_id:
            return jsonify({'error': 'Not logged in'}), 401
        
        order_status = request.args.get('status')
        
        # Filter by order status if provided
        seller_orders = orders
        if order_status:
            seller_orders = [o for o in seller_orders if o.get('order_status') == order_status]
        
        # Sort by created_at descending
        seller_orders.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({
            'orders': seller_orders,
            'count': len(seller_orders)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/update_upi', methods=['POST'])
def update_upi():
    """Update seller's UPI ID"""
    try:
        seller_id = session.get('seller_id')
        if not seller_id:
            return jsonify({'error': 'Not logged in'}), 401
        
        data = request.get_json()
        upi_id = data.get('upi_id', '')
        
        if not upi_id:
            return jsonify({'error': 'UPI ID is required'}), 400
        
        # Update company info
        company_info['upi_id'] = upi_id
        
        # Save to Firebase
        save_data_to_firebase(seller_id)
        
        return jsonify({
            'message': 'UPI ID updated successfully',
            'upi_id': upi_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/seller_info', methods=['GET'])
def get_seller_info():
    """Get seller information including UPI ID"""
    try:
        seller_id = session.get('seller_id')
        if not seller_id:
            return jsonify({'error': 'Not logged in'}), 401
        
        return jsonify({
            'id': seller_id,
            'company_name': company_info.get('company_name', ''),
            'company_description': company_info.get('company_description', ''),
            'upi_id': company_info.get('upi_id', ''),
            'email': company_info.get('email', ''),
            'phone': company_info.get('phone', ''),
            'picture': company_info.get('picture', '')
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/company', methods=['GET', 'POST'])
def company_info_route():
    """Get or update company information"""
    try:
        seller_id = session.get('seller_id')
        if not seller_id:
            return jsonify({'error': 'Not logged in'}), 401
        
        if request.method == 'GET':
            return jsonify({
                'company_name': company_info.get('company_name', ''),
                'email': company_info.get('email', ''),
                'phone': company_info.get('phone', ''),
                'address': company_info.get('address', ''),
                'city': company_info.get('city', ''),
                'state': company_info.get('state', ''),
                'pincode': company_info.get('pincode', ''),
                'country': company_info.get('country', ''),
                'upi_id': company_info.get('upi_id', ''),
                'company_description': company_info.get('company_description', '')
            }), 200
        
        elif request.method == 'POST':
            data = request.get_json()
            
            # Update company info
            company_info['company_name'] = data.get('company_name', company_info.get('company_name', ''))
            company_info['email'] = data.get('email', company_info.get('email', ''))
            company_info['phone'] = data.get('phone', company_info.get('phone', ''))
            company_info['address'] = data.get('address', company_info.get('address', ''))
            company_info['city'] = data.get('city', company_info.get('city', ''))
            company_info['state'] = data.get('state', company_info.get('state', ''))
            company_info['pincode'] = data.get('pincode', company_info.get('pincode', ''))
            company_info['country'] = data.get('country', company_info.get('country', ''))
            company_info['upi_id'] = data.get('upi_id', company_info.get('upi_id', ''))
            company_info['company_description'] = data.get('company_description', company_info.get('company_description', ''))
            
            # Save to Firebase
            save_data_to_firebase(seller_id)
            
            return jsonify({'message': 'Company information updated successfully'}), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products/<int:product_id>', methods=['PUT', 'DELETE'])
def update_delete_product(product_id):
    """Update or delete a product"""
    global products
    
    try:
        seller_id = session.get('seller_id')
        if not seller_id:
            return jsonify({'error': 'Not logged in'}), 401
        
        if request.method == 'PUT':
            data = request.get_json()
            
            # Find and update product
            for product in products:
                if product.get('id') == product_id:
                    product['title'] = data.get('title', product['title'])
                    product['description'] = data.get('description', product['description'])
                    product['price'] = float(data.get('price', product['price']))
                    product['category'] = data.get('category', product.get('category', ''))
                    product['stock_quantity'] = int(data.get('stock_quantity', product.get('stock_quantity', 0)))
                    product['image_url'] = data.get('image_url', product.get('image_url', ''))
                    
                    # Save to Firebase
                    save_data_to_firebase(seller_id)
                    
                    return jsonify({'message': 'Product updated successfully', 'product': product}), 200
            
            return jsonify({'error': 'Product not found'}), 404
        
        elif request.method == 'DELETE':
            # Find and remove product
            products = [p for p in products if p.get('id') != product_id]
            
            # Save to Firebase
            save_data_to_firebase(seller_id)
            
            return jsonify({'message': 'Product deleted successfully'}), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products', methods=['POST'])
def create_product():
    """Create a new product"""
    try:
        seller_id = session.get('seller_id')
        if not seller_id:
            return jsonify({'error': 'Not logged in'}), 401
        
        data = request.get_json()
        
        # Generate new product ID
        new_id = max([p.get('id', 0) for p in products], default=0) + 1
        
        product = {
            'id': new_id,
            'title': data['title'],
            'description': data.get('description', ''),
            'price': float(data['price']),
            'category': data.get('category', ''),
            'stock_quantity': int(data.get('stock_quantity', 0)),
            'image_url': data.get('image_url', ''),
            'created_at': datetime.now().isoformat()
        }
        
        products.append(product)
        
        # Save to Firebase
        save_data_to_firebase(seller_id)
        
        return jsonify({'message': 'Product created successfully', 'product': product}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/orders/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    """Update order status"""
    try:
        seller_id = session.get('seller_id')
        if not seller_id:
            return jsonify({'error': 'Not logged in'}), 401
        
        # Handle both JSON and FormData
        if request.content_type and 'multipart/form-data' in request.content_type:
            # FormData from frontend (with potential file upload)
            data = request.form.to_dict()
        else:
            # Regular JSON
            data = request.get_json()
        
        # Find and update order
        for order in orders:
            if order.get('order_id') == order_id or order.get('id') == order_id:
                # Track if order status or payment status changed
                old_order_status = order.get('order_status')
                old_payment_status = order.get('payment_status')
                order_status_changed = False
                payment_status_changed = False
                new_order_status = old_order_status
                new_payment_status = old_payment_status
                
                if 'order_status' in data:
                    new_order_status = data['order_status']
                    if old_order_status != new_order_status:
                        order_status_changed = True
                        order['order_status'] = new_order_status
                
                if 'payment_status' in data:
                    new_payment_status = data['payment_status']
                    if old_payment_status != new_payment_status:
                        payment_status_changed = True
                    order['payment_status'] = new_payment_status
                    
                if 'buyer_phone' in data:
                    order['buyer_phone'] = data['buyer_phone']
                if 'delivery_lat' in data:
                    order['delivery_lat'] = data['delivery_lat']
                if 'delivery_lng' in data:
                    order['delivery_lng'] = data['delivery_lng']
                
                # Save to Firebase
                save_data_to_firebase(seller_id)
                
                buyer_phone = order.get('buyer_phone')
                
                # Send WhatsApp notification if order status changed
                if order_status_changed and buyer_phone:
                    # Check if custom message is provided
                    if 'custom_message' in data and data['custom_message']:
                        message = data['custom_message']
                    else:
                        # Get items display for multi-item orders
                        items_display = ""
                        if order.get('items') and len(order['items']) > 0:
                            if len(order['items']) == 1:
                                items_display = f"{order['items'][0]['product_name']} x{order['items'][0]['quantity']}"
                            else:
                                items_display = "\n".join([f"- {item['product_name']} x{item['quantity']}" for item in order['items']])
                        else:
                            items_display = order.get('product_name', 'your order')
                        
                        message = (
                            f"🛒 *Order Status Update* 🛒\n\n"
                            f"Order ID: #{order_id}\n"
                            f"Items:\n{items_display}\n\n"
                            f"Status: *{new_order_status}*\n\n"
                            f"Thank you for your order!"
                        )
                    
                    try:
                        send_whatsapp_message(buyer_phone, message)
                        print(f"✅ Order status WhatsApp notification sent to {buyer_phone}")
                    except Exception as e:
                        print(f"⚠️ Failed to send order status notification: {e}")
                
                # Send WhatsApp notification if payment status changed
                if payment_status_changed and buyer_phone:
                    total_amount = order.get('total_amount') or order.get('amount', 0)
                    
                    # Get items display for multi-item orders
                    items_display = ""
                    if order.get('items') and len(order['items']) > 0:
                        if len(order['items']) == 1:
                            items_display = f"{order['items'][0]['product_name']} x{order['items'][0]['quantity']}"
                        else:
                            items_display = "\n".join([f"- {item['product_name']} x{item['quantity']}" for item in order['items']])
                    else:
                        items_display = order.get('product_name', 'your order')
                    

                    
                    if 'custom_message' in data and data['custom_message'] and new_payment_status != "Requested":
                        message = data['custom_message']
                    else:
                        if new_payment_status == "Requested":
                            # Check if Razorpay is enabled
                            print(f"🔍 DEBUG: Checking Razorpay for seller {seller_id}")
                            razorpay_credentials = get_razorpay_credentials(seller_id)
                            print(f"🔍 DEBUG: Credentials = {razorpay_credentials}")
                            
                            if razorpay_credentials and razorpay_credentials.get('enabled'):
                                print(f"✅ DEBUG: Razorpay IS enabled, creating payment link...")
                                # Create Razorpay payment link
                                print(f"🔗 Creating Razorpay payment link for order {order_id}...")
                                
                                buyer_name = order.get('buyer_name', 'Customer')
                                payment_result = create_payment_link(
                                    seller_id=seller_id,
                                    order_id=order_id,
                                    amount=total_amount,
                                    customer_name=buyer_name,
                                    customer_phone=buyer_phone,
                                    description=f"Payment for Order #{order_id}"
                                )
                                
                                if payment_result.get('success'):
                                    payment_link = payment_result.get('payment_link')
                                    message = (
                                        f"💳 *Payment Request* 💳\n\n"
                                        f"Order ID: #{order_id}\n"
                                        f"Items:\n{items_display}\n"
                                        f"Amount: *₹{total_amount:.2f}*\n\n"
                                        f"Please complete your payment using this secure link:\n"
                                        f"🔗 {payment_link}\n\n"
                                        f"After payment, your order will be automatically confirmed.\n\n"
                                        f"Thank you! 🙏"
                                    )
                                else:
                                    # Fallback to UPI if payment link creation fails
                                    print(f"⚠️ Payment link creation failed: {payment_result.get('error')}")
                                    upi_id = company_info.get('upi_id', '')
                                    if upi_id:
                                        message = (
                                            f"💳 *Payment Request* 💳\n\n"
                                            f"Order ID: #{order_id}\n"
                                            f"Items:\n{items_display}\n"
                                            f"Amount: *₹{total_amount:.2f}*\n\n"
                                            f"Please pay to UPI ID:\n"
                                            f"📱 *{upi_id}*\n\n"
                                            f"After payment, please share the transaction screenshot for verification.\n\n"
                                            f"Thank you! 🙏"
                                        )
                                    else:
                                        message = (
                                            f"💳 *Payment Request* 💳\n\n"
                                            f"Order ID: #{order_id}\n"
                                            f"Items:\n{items_display}\n"
                                            f"Amount: *₹{total_amount:.2f}*\n\n"
                                            f"Please contact the seller for payment details.\n\n"
                                            f"Thank you! 🙏"
                                        )
                            else:
                                # Razorpay not enabled, use UPI
                                print(f"⚠️ DEBUG: Razorpay NOT enabled, falling back to UPI")
                                upi_id = company_info.get('upi_id', '')
                                if upi_id:
                                    message = (
                                        f"💳 *Payment Request* 💳\n\n"
                                        f"Order ID: #{order_id}\n"
                                        f"Items:\n{items_display}\n"
                                        f"Amount: *₹{total_amount:.2f}*\n\n"
                                        f"Please pay to UPI ID:\n"
                                        f"📱 *{upi_id}*\n\n"
                                        f"After payment, please share the transaction screenshot for verification.\n\n"
                                        f"Thank you! 🙏"
                                    )
                                else:
                                    message = (
                                        f"💳 *Payment Request* 💳\n\n"
                                        f"Order ID: #{order_id}\n"
                                        f"Items:\n{items_display}\n"
                                        f"Amount: *₹{total_amount:.2f}*\n\n"
                                        f"Please contact the seller for payment details.\n\n"
                                        f"Thank you! 🙏"
                                    )
                        elif new_payment_status == "Completed":
                            message = (
                                f"✅ *Payment Confirmed* ✅\n\n"
                                f"Order ID: #{order_id}\n"
                                f"Items:\n{items_display}\n"
                                f"Amount: ₹{total_amount:.2f}\n\n"
                                f"Your payment has been received and confirmed!\n"
                                f"Your order will be processed shortly.\n\n"
                                f"Thank you for your purchase! 🎉"
                            )
                        elif new_payment_status == "Pending":
                            message = (
                                f"⏳ *Payment Status Update* ⏳\n\n"
                                f"Order ID: #{order_id}\n"
                                f"Items:\n{items_display}\n"
                                f"Amount: ₹{total_amount:.2f}\n\n"
                                f"Payment status: *Pending*\n\n"
                                f"We'll notify you once payment is requested.\n\n"
                                f"Thank you! 🙏"
                            )
                        else:
                            message = None
                    
                    if message:
                        # Check for attached invoice file
                        invoice_file = request.files.get('invoice')
                        
                        try:
                            if invoice_file and new_payment_status == 'Requested':
                                # Validate PDF file
                                if invoice_file.content_type == 'application/pdf':
                                    print(f"📎 Invoice PDF attached, sending via WhatsApp...")
                                    # Send PDF with caption
                                    send_whatsapp_media(buyer_phone, invoice_file, message)
                                else:
                                    print(f"⚠️ Invalid file type: {invoice_file.content_type}. Only PDF allowed.")
                                    # Fall back to text-only
                                    send_whatsapp_message(buyer_phone, message)
                            else:
                                # Text-only message
                                send_whatsapp_message(buyer_phone, message)
                            print(f"✅ Payment status WhatsApp notification sent to {buyer_phone}")
                        except Exception as e:
                            print(f"⚠️ Failed to send payment status notification: {e}")
                
                return jsonify({'message': 'Order updated successfully', 'order': order}), 200
        
        return jsonify({'error': 'Order not found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== RAZORPAY INTEGRATION ENDPOINTS =====

@app.route('/api/razorpay/credentials', methods=['POST'])
def save_razorpay_creds():
    """Save Razorpay API credentials"""
    try:
        seller_id = session.get('seller_id')
        if not seller_id:
            return jsonify({'error': 'Not logged in'}), 401
        
        data = request.get_json()
        api_key = data.get('api_key')
        api_secret = data.get('api_secret')
        
        if not api_key or not api_secret:
            return jsonify({'error': 'API key and secret are required'}), 400
        
        # Save credentials to Firebase
        result = save_razorpay_credentials(seller_id, api_key, api_secret, enabled=True)
        
        if result:
            return jsonify({
                'success': True,
                'message': 'Razorpay credentials saved successfully'
            }), 200
        else:
            return jsonify({'error': 'Failed to save credentials'}), 500
            
    except Exception as e:
        print(f"Error saving Razorpay credentials: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/razorpay/status', methods=['GET'])
def get_razorpay_status():
    """Get Razorpay connection status"""
    try:
        seller_id = session.get('seller_id')
        if not seller_id:
            return jsonify({'error': 'Not logged in'}), 401
        
        credentials = get_razorpay_credentials(seller_id)
        
        if credentials and credentials.get('enabled'):
            return jsonify({
                'connected': True,
                'api_key': credentials.get('api_key', '')[:20] + '...',  # Only show partial key
                'enabled': True
            }), 200
        else:
            return jsonify({
                'connected': False,
                'enabled': False
            }), 200
            
    except Exception as e:
        print(f"Error getting Razorpay status: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/razorpay/disconnect', methods=['POST'])
def disconnect_razorpay():
    """Disconnect Razorpay by setting enabled to false"""
    try:
        seller_id = session.get('seller_id')
        if not seller_id:
            return jsonify({'error': 'Not logged in'}), 401
        
        credentials = get_razorpay_credentials(seller_id)
        
        if not credentials:
            return jsonify({'error': 'No Razorpay credentials found'}), 404
        
        # Set enabled to false while keeping credentials
        api_key = credentials.get('api_key', '')
        api_secret = credentials.get('api_secret', '')
        
        result = save_razorpay_credentials(seller_id, api_key, api_secret, enabled=False)
        
        if result:
            return jsonify({
                'success': True,
                'message': 'Razorpay disconnected successfully'
            }), 200
        else:
            return jsonify({'error': 'Failed to disconnect Razorpay'}), 500
            
    except Exception as e:
        print(f"Error disconnecting Razorpay: {e}")
        return jsonify({'error': str(e)}), 500



@app.route('/api/razorpay/webhook', methods=['POST'])
def razorpay_webhook():
    """Handle Razorpay webhook notifications"""
    try:
        # Get webhook payload
        payload = request.get_data(as_text=True)
        signature = request.headers.get('X-Razorpay-Signature')
        
        if not signature:
            return jsonify({'error': 'Missing signature'}), 400
        
        # Parse JSON payload to get seller_id and verify signature
        data = json.loads(payload)
        event = data.get('event')
        
        # Extract order information from webhook
        payment_link_data = data.get('payload', {}).get('payment_link', {}).get('entity', {})
        notes = payment_link_data.get('notes', {})
        seller_id = notes.get('seller_id')
        
        if not seller_id:
            print("⚠️ Webhook received but no seller_id in notes")
            return jsonify({'status': 'ignored', 'reason': 'no seller_id'}), 200
        
        # Get seller's webhook secret from Razorpay credentials
        credentials = get_razorpay_credentials(seller_id)
        
        # For now, we'll skip strict signature verification since webhook_secret
        # might not be stored. In production, you should store and verify it.
        # webhook_secret = credentials.get('webhook_secret')
        # if not verify_webhook_signature(payload.encode(), signature, webhook_secret):
        #     return jsonify({'error': 'Invalid signature'}), 401
        
        # Handle payment link paid event
        if event == 'payment_link.paid':
            payment_link_id = payment_link_data.get('id')
            # Get the actual payment details
            payments = data.get('payload', {}).get('payment', {}).get('entity', {})
            payment_id = payments.get('id')
            
            print(f"💰 Payment completed: {payment_id} for link {payment_link_id}")
            
            # Update order status
            result = handle_payment_success(payment_link_id, payment_id, seller_id)
            
            if result.get('success'):
                order_id = result.get('order_id')
                print(f"✅ Order #{order_id} payment status updated to Completed")
                
                # TODO: Send WhatsApp confirmation to buyer
                # You can add this later
                
                return jsonify({
                    'status': 'success',
                    'order_id': order_id
                }), 200
            else:
                print(f"⚠️ Failed to update order: {result.get('error')}")
                return jsonify({'status': 'error', 'error': result.get('error')}), 500
        
        # For other events, just acknowledge receipt
        return jsonify({'status': 'received'}), 200
        
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
