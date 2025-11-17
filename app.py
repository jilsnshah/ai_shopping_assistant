from flask import Flask, render_template, request, jsonify
import os
import json
from datetime import datetime

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


@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['company_name', 'company_description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if email already exists (if provided)
        if data.get('email'):
            if any(s['email'] == data['email'] for s in sellers):
                return jsonify({'error': 'Email already registered'}), 400
        
        # Generate new seller ID
        seller_id = len(sellers) + 1
        
        # Create new seller
        seller = {
            'id': seller_id,
            'company_name': data['company_name'],
            'company_description': data['company_description'],
            'owner_name': data.get('owner_name', ''),
            'email': data.get('email', ''),
            'phone': data.get('phone', ''),
            'address': data.get('address', ''),
            'upi_id': None,
            'registered_at': datetime.now().isoformat()
        }
        
        sellers.append(seller)
        
        # Save to JSON file
        save_data_to_json()
        
        return jsonify({
            'message': 'Business registered successfully',
            'seller': seller
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/add_product', methods=['POST'])
def add_product():
    try:
        # Get JSON data
        data = request.get_json()
        title = data.get('title')
        description = data.get('description')
        price = data.get('price')
        seller_id = int(data.get('seller_id', 1))  # Default seller ID for MVP
        
        # Validate required fields
        if not all([title, description, price]):
            return jsonify({'error': 'Title, description, and price are required'}), 400
        
        try:
            price = float(price)
            if price <= 0:
                return jsonify({'error': 'Price must be greater than 0'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid price format'}), 400
        
        # Generate unique product ID
        product_id = len(products) + 1
        
        # Create product
        product = {
            'id': product_id,
            'seller_id': seller_id,
            'title': title,
            'description': description,
            'price': price,
            'created_at': datetime.now().isoformat()
        }
        
        products.append(product)
        
        # Save to JSON file
        save_data_to_json()
        
        return jsonify({
            'message': 'Product added successfully',
            'product': product,
            'product_id': product_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/products', methods=['GET'])
def get_products():
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


@app.route('/delivery_orders')
def delivery_orders():
    """Render delivery orders page"""
    return render_template('delivery_orders.html')


@app.route('/payments')
def payments():
    """Render payments page"""
    return render_template('payments.html')


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


@app.route('/api/mark_paid', methods=['POST'])
def mark_paid():
    """Mark an order as paid"""
    try:
        data = request.get_json()
        order_id = data.get('order_id')
        
        if not order_id:
            return jsonify({'error': 'Order ID is required'}), 400
        
        # Find and update order
        order_found = False
        for order in orders:
            if order['id'] == order_id:
                order['payment_status'] = 'Verified'
                order_found = True
                break
        
        if order_found:
            # Save to JSON file
            save_data_to_json()
        
        return jsonify({
            'message': 'Order marked as paid successfully'
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


@app.route('/activate_ai', methods=['POST'])
def activate_ai():
    """Placeholder endpoint for AI activation"""
    return jsonify({
        'message': 'AI Assistant activation feature coming soon!',
        'status': 'pending'
    }), 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
