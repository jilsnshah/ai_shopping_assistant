from flask import Flask, render_template, request, jsonify, session
import os
import json
from datetime import datetime
from whatsapp_msg import send_whatsapp_message
from firebase_db import load_seller_data, save_seller_data, initialize_firebase

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

@app.route('/logout')
def logout():
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
            'phone': company_info.get('phone', '')
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
                'name': company_info.get('company_name', ''),
                'email': company_info.get('email', ''),
                'phone': company_info.get('phone', ''),
                'address': company_info.get('address', ''),
                'description': company_info.get('company_description', '')
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
                    
                    # Get seller's UPI ID from company_info
                    upi_id = company_info.get('upi_id', '')
                    
                    if new_payment_status == "Requested":
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
                        try:
                            send_whatsapp_message(buyer_phone, message)
                            print(f"✅ Payment status WhatsApp notification sent to {buyer_phone}")
                        except Exception as e:
                            print(f"⚠️ Failed to send payment status notification: {e}")
                
                return jsonify({'message': 'Order updated successfully', 'order': order}), 200
        
        return jsonify({'error': 'Order not found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
