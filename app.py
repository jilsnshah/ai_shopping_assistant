from flask import Flask, render_template, request, jsonify
import os
import json
from datetime import datetime
from whatsapp_msg import send_whatsapp_message

app = Flask(__name__)

# In-memory storage using dictionaries
sellers = []
products = []
orders = []

# Load data from JSON file
def load_data_from_json():
    global sellers, products, orders
    
    json_file_path = os.path.join('static', 'sample_data.json')
    
    try:
        with open(json_file_path, 'r') as f:
            data = json.load(f)
            
        # Load sellers
        sellers = data.get('sellers', [])
        
        # Load products
        products = data.get('products', [])
        
        # Load orders
        orders = data.get('orders', [])
        
        print(f"✅ Data loaded successfully from {json_file_path}")
        print(f"   - Sellers: {len(sellers)}")
        print(f"   - Products: {len(products)}")
        print(f"   - Orders: {len(orders)}")
        
    except FileNotFoundError:
        print(f"❌ Error: {json_file_path} not found!")
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing JSON: {e}")

# Save data to JSON file
def save_data_to_json():
    global sellers, products, orders
    
    json_file_path = os.path.join('static', 'sample_data.json')
    
    try:
        data = {
            'sellers': sellers,
            'products': products,
            'orders': orders
        }
        
        with open(json_file_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"💾 Data saved successfully to {json_file_path}")
        return True
    except Exception as e:
        print(f"❌ Error saving to JSON: {e}")
        return False

# Initialize data on startup
load_data_from_json()

# Reload data before each request to reflect any changes from the agent
@app.before_request
def reload_data():
    load_data_from_json()

# Disable caching for all responses
@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/company')
def company():
    return render_template('company.html')

@app.route('/products')
def products():
    return render_template('products.html')

@app.route('/orders')
def orders():
    return render_template('orders.html')

@app.route('/customers')
def customers():
    return render_template('customers.html')


# ===== API ENDPOINTS =====

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products for a seller"""
    try:
        seller_id = int(request.args.get('seller_id', 1))  # Default seller ID for MVP
        
        print(f"📦 GET /products request - seller_id: {seller_id}, total products: {len(products)}")
        
        # Filter products by seller_id
        seller_products = [p for p in products if p['seller_id'] == seller_id]
        
        print(f"   ✅ Returning {len(seller_products)} products for seller {seller_id}")
        
        # Sort by created_at descending
        seller_products.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({
            'products': seller_products,
            'count': len(seller_products)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Get all orders for a seller"""
    try:
        seller_id = int(request.args.get('seller_id', 1))
        order_status = request.args.get('status')  # 'Received' or 'To Deliver'
        
        # Filter orders by seller_id
        seller_orders = [o for o in orders if o['seller_id'] == seller_id]
        
        # Filter by order status if provided
        if order_status:
            seller_orders = [o for o in seller_orders if o['order_status'] == order_status]
        
        # Sort by created_at descending
        seller_orders.sort(key=lambda x: x['created_at'], reverse=True)
        
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
        data = request.get_json()
        seller_id = int(data.get('seller_id', 1))
        upi_id = data.get('upi_id', '')
        
        if not upi_id:
            return jsonify({'error': 'UPI ID is required'}), 400
        
        # Find and update seller
        seller_found = False
        for seller in sellers:
            if seller['id'] == seller_id:
                seller['upi_id'] = upi_id
                seller_found = True
                break
        
        if seller_found:
            # Save to JSON file
            save_data_to_json()
        
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
        seller_id = int(request.args.get('seller_id', 1))
        
        # Find seller by ID
        seller = next((s for s in sellers if s['id'] == seller_id), None)
        
        if seller:
            return jsonify({
                'id': seller['id'],
                'company_name': seller['company_name'],
                'company_description': seller['company_description'],
                'upi_id': seller['upi_id'] or '',
                'email': seller['email'],
                'phone': seller['phone']
            }), 200
        else:
            return jsonify({'error': 'Seller not found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/company', methods=['GET', 'POST'])
def company_info():
    """Get or update company information"""
    try:
        if request.method == 'GET':
            seller_id = int(request.args.get('seller_id', 1))
            seller = next((s for s in sellers if s['id'] == seller_id), None)
            
            if seller:
                return jsonify({
                    'name': seller['company_name'],
                    'email': seller['email'],
                    'phone': seller['phone'],
                    'address': seller['address'],
                    'description': seller['company_description']
                }), 200
            else:
                return jsonify({'error': 'Seller not found'}), 404
        
        elif request.method == 'POST':
            data = request.get_json()
            seller_id = int(data.get('seller_id', 1))
            
            # Find and update seller
            for seller in sellers:
                if seller['id'] == seller_id:
                    seller['company_name'] = data.get('name', seller['company_name'])
                    seller['email'] = data.get('email', seller['email'])
                    seller['phone'] = data.get('phone', seller['phone'])
                    seller['address'] = data.get('address', seller['address'])
                    seller['company_description'] = data.get('description', seller['company_description'])
                    
                    # Save to JSON
                    save_data_to_json()
                    
                    return jsonify({'message': 'Company information updated successfully'}), 200
            
            return jsonify({'error': 'Seller not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products/<int:product_id>', methods=['PUT', 'DELETE'])
def update_delete_product(product_id):
    """Update or delete a product"""
    global products
    
    try:
        if request.method == 'PUT':
            data = request.get_json()
            
            # Find and update product
            for product in products:
                if product['id'] == product_id:
                    product['title'] = data.get('title', product['title'])
                    product['description'] = data.get('description', product['description'])
                    product['price'] = float(data.get('price', product['price']))
                    product['category'] = data.get('category', product.get('category', ''))
                    product['stock_quantity'] = int(data.get('stock_quantity', product.get('stock_quantity', 0)))
                    product['image_url'] = data.get('image_url', product.get('image_url', ''))
                    
                    # Save to JSON
                    save_data_to_json()
                    
                    return jsonify({'message': 'Product updated successfully', 'product': product}), 200
            
            return jsonify({'error': 'Product not found'}), 404
        
        elif request.method == 'DELETE':
            # Find and remove product
            products = [p for p in products if p['id'] != product_id]
            
            # Save to JSON
            save_data_to_json()
            
            return jsonify({'message': 'Product deleted successfully'}), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products', methods=['POST'])
def create_product():
    """Create a new product"""
    try:
        data = request.get_json()
        
        # Generate new product ID
        new_id = max([p['id'] for p in products], default=0) + 1
        
        product = {
            'id': new_id,
            'seller_id': int(data.get('seller_id', 1)),
            'title': data['title'],
            'description': data.get('description', ''),
            'price': float(data['price']),
            'category': data.get('category', ''),
            'stock_quantity': int(data.get('stock_quantity', 0)),
            'image_url': data.get('image_url', ''),
            'created_at': datetime.now().isoformat()
        }
        
        products.append(product)
        
        # Save to JSON
        save_data_to_json()
        
        return jsonify({'message': 'Product created successfully', 'product': product}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/orders/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    """Update order status"""
    try:
        data = request.get_json()
        
        # Find and update order
        for order in orders:
            if order['id'] == order_id:
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
                
                # Save to JSON
                save_data_to_json()
                
                buyer_phone = order.get('buyer_phone')
                
                # Send WhatsApp notification if order status changed
                if order_status_changed and buyer_phone:
                    product_name = order.get('product_name', 'your order')
                    
                    message = (
                        f"🛒 *Order Update* 🛒\n\n"
                        f"Order ID: #{order_id}\n"
                        f"Product: {product_name}\n"
                        f"Status: *{new_order_status}*\n\n"
                        f"Thank you for your order!"
                    )
                    
                    try:
                        send_whatsapp_message(buyer_phone, message)
                        print(f"✅ Order status WhatsApp notification sent to {buyer_phone}")
                    except Exception as e:
                        print(f"⚠️ Failed to send order status notification: {e}")
                
                # Send payment request WhatsApp notification if payment status changed to "Requested"
                if payment_status_changed and new_payment_status == "Requested" and buyer_phone:
                    product_name = order.get('product_name', 'your order')
                    amount = order.get('amount', 0)
                    seller_id = order.get('seller_id', 1)
                    
                    # Get seller's UPI ID
                    seller = next((s for s in sellers if s['id'] == seller_id), None)
                    upi_id = seller.get('upi_id', '') if seller else ''
                    
                    if upi_id:
                        message = (
                            f"💳 *Payment Request* 💳\n\n"
                            f"Order ID: #{order_id}\n"
                            f"Product: {product_name}\n"
                            f"Amount: *₹{amount:.2f}*\n\n"
                            f"Please pay to UPI ID:\n"
                            f"📱 *{upi_id}*\n\n"
                            f"After payment, please share the transaction screenshot for verification.\n\n"
                            f"Thank you! 🙏"
                        )
                    else:
                        message = (
                            f"💳 *Payment Request* 💳\n\n"
                            f"Order ID: #{order_id}\n"
                            f"Product: {product_name}\n"
                            f"Amount: *₹{amount:.2f}*\n\n"
                            f"Please contact the seller for payment details.\n\n"
                            f"Thank you! 🙏"
                        )
                    
                    try:
                        send_whatsapp_message(buyer_phone, message)
                        print(f"✅ Payment request WhatsApp notification sent to {buyer_phone}")
                    except Exception as e:
                        print(f"⚠️ Failed to send payment request notification: {e}")
                
                return jsonify({'message': 'Order updated successfully', 'order': order}), 200
        
        return jsonify({'error': 'Order not found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
