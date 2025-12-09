"""
Tool Functions for AI Shopping Assistant
This file contains all the functions that will be used as tools by the LangChain agent.
"""

import json
import os
from datetime import datetime
from langchain.tools import tool


# ==================== GLOBAL STATE ====================
current_user = {
    "phone_number": None,
}


def set_current_user(phone_number):
    """Set the current user's phone number"""
    global current_user
    current_user["phone_number"] = phone_number


def load_sample_data():
    """Load data from sample_data.json file (seller data)"""
    json_file_path = os.path.join('static', 'sample_data.json')
    
    try:
        with open(json_file_path, 'r') as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        print(f"Error: {json_file_path} not found!")
        return None
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return None


def load_buyers_data():
    """Load data from buyers_data.json file"""
    json_file_path = os.path.join('static', 'buyers_data.json')
    
    try:
        with open(json_file_path, 'r') as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        print(f"Error: {json_file_path} not found!")
        return {"buyers": {}}
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return {"buyers": {}}


def save_buyers_data(data):
    """Save data to buyers_data.json file"""
    json_file_path = os.path.join('static', 'buyers_data.json')
    
    try:
        with open(json_file_path, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving buyers data: {e}")
        return False


def get_company_info():
    """
    Get company name and description.
    
    Returns:
        dict: Company information including name and description
    """
    data = load_sample_data()
    
    if not data or not data.get('sellers'):
        return {"error": "No company information found"}
    
    seller = data['sellers'][0]  # Get first seller
    
    return {
        "company_name": seller.get('company_name', ''),
        "company_description": seller.get('company_description', ''),
        "owner_name": seller.get('owner_name', ''),
        "phone": seller.get('phone', ''),
        "email": seller.get('email', ''),
        "address": seller.get('address', '')
    }


def get_product_catalog():
    """
    Get all products with their details including description and price.
    
    Returns:
        list: List of products with id, title, description, and price
    """
    data = load_sample_data()
    
    if not data or not data.get('products'):
        return {"error": "No products found"}
    
    products = []
    for product in data['products']:
        products.append({
            "product_id": product.get('id'),
            "title": product.get('title', ''),
            "description": product.get('description', ''),
            "price": product.get('price', 0)
        })
    
    return products


def get_product_by_id(product_id: int):
    """
    Get specific product details by product ID.
    
    Args:
        product_id (int): The ID of the product
        
    Returns:
        dict: Product information or error message
    """
    data = load_sample_data()
    
    if not data or not data.get('products'):
        return {"error": "No products found"}
    
    for product in data['products']:
        if product.get('id') == product_id:
            return {
                "product_id": product.get('id'),
                "title": product.get('title', ''),
                "description": product.get('description', ''),
                "price": product.get('price', 0)
            }
    
    return {"error": f"Product with ID {product_id} not found"}


def check_buyer_profile(phone_number: str):
    """
    Check if buyer profile exists by phone number.
    
    Args:
        phone_number (str): The phone number to check
        
    Returns:
        dict: Buyer profile if exists, None otherwise
    """
    buyers_data = load_buyers_data()
    
    if phone_number in buyers_data.get('buyers', {}):
        buyer = buyers_data['buyers'][phone_number]
        return {
            "exists": True,
            "name": buyer.get('name'),
            "phone_number": buyer.get('phone_number'),
            "created_at": buyer.get('created_at'),
            "total_orders": len(buyer.get('orders', []))
        }
    
    return {
        "exists": False,
        "message": "No profile found for this phone number"
    }


def create_buyer_profile(phone_number: str, name: str):
    """
    Create a new buyer profile.
    
    Args:
        phone_number (str): The buyer's phone number
        name (str): The buyer's name
        
    Returns:
        dict: Success status and buyer profile
    """
    buyers_data = load_buyers_data()
    
    # Check if profile already exists
    if phone_number in buyers_data.get('buyers', {}):
        return {
            "success": False,
            "error": "Buyer profile already exists",
            "buyer": buyers_data['buyers'][phone_number]
        }
    
    # Create new profile
    buyers_data['buyers'][phone_number] = {
        "phone_number": phone_number,
        "name": name,
        "created_at": datetime.now().isoformat(),
        "orders": []
    }
    
    # Save to file
    if save_buyers_data(buyers_data):
        return {
            "success": True,
            "message": f"Welcome {name}! Your profile has been created.",
            "buyer": buyers_data['buyers'][phone_number]
        }
    else:
        return {
            "success": False,
            "error": "Failed to save buyer profile"
        }


def place_order(product_id: int, quantity: int, buyer_name: str, delivery_address: str, delivery_lat: float, delivery_lng: float, buyer_phone: str = None):
    """
    Place an order for a product and save it to both seller and buyer databases.
    
    Args:
        product_id (int): The ID of the product to order
        quantity (int): Number of items to order
        buyer_name (str): Name of the buyer
        delivery_address (str): Delivery address for the order
        delivery_lat (float): Latitude of delivery location
        delivery_lng (float): Longitude of delivery location
        buyer_phone (str): Phone number of the buyer (for WhatsApp orders)
        
    Returns:
        dict: Order confirmation with order details
    """
    # Load seller data (products)
    seller_data = load_sample_data()
    
    if not seller_data:
        return {"error": "Unable to load seller data"}
    
    # Find the product
    product = None
    for p in seller_data.get('products', []):
        if p.get('id') == product_id:
            product = p
            break
    
    if not product:
        return {"error": f"Product with ID {product_id} not found"}
    
    # Validate quantity
    if quantity <= 0:
        return {"error": "Quantity must be greater than 0"}
    
    # Calculate total amount
    total_amount = product.get('price', 0) * quantity
    
    # Get seller_id from product
    seller_id = product.get('seller_id', 1)
    
    # Generate order ID
    order_id = len(seller_data.get('orders', [])) + 1
    
    # Create timestamp
    timestamp = datetime.now().isoformat()
    
    # Create unified order structure
    # This structure is IDENTICAL for both buyer and seller databases
    order = {
        "id": order_id,
        "seller_id": seller_id,
        "product_id": product_id,
        "product_name": product.get('title'),
        "quantity": quantity,
        "unit_price": product.get('price'),
        "amount": total_amount,
        "buyer_name": buyer_name,
        "buyer_phone": buyer_phone if buyer_phone else "",
        "delivery_address": delivery_address,
        "delivery_lat": delivery_lat,
        "delivery_lng": delivery_lng,
        "payment_status": "Pending",
        "order_status": "Received",
        "created_at": timestamp
    }
    
    if 'orders' not in seller_data:
        seller_data['orders'] = []
    seller_data['orders'].append(order)
    
    json_file_path = os.path.join('static', 'sample_data.json')
    try:
        with open(json_file_path, 'w') as f:
            json.dump(seller_data, f, indent=2)
    except Exception as e:
        return {
            "error": f"Order created but failed to save to seller DB: {str(e)}",
            "order_details": order
        }
    
    # Save to buyer database (for WhatsApp users)
    if buyer_phone:
        buyers_data = load_buyers_data()
        
        # Create or update buyer
        if buyer_phone not in buyers_data['buyers']:
            buyers_data['buyers'][buyer_phone] = {
                "phone_number": buyer_phone,
                "name": buyer_name,
                "created_at": datetime.now().isoformat(),
                "orders": []
            }
        else:
            # Update buyer name if provided
            if buyer_name:
                buyers_data['buyers'][buyer_phone]['name'] = buyer_name
        
        # Add order to buyer's orders (same structure as seller)
        buyers_data['buyers'][buyer_phone]['orders'].append(order)
        
        # Save buyers data
        if not save_buyers_data(buyers_data):
            print("Warning: Failed to save to buyer database")
    
    return {
        "success": True,
        "message": f"Order placed successfully! Order ID: {order_id}. Total: ₹{total_amount:.2f}",
        "order_id": order_id,
        "product_name": product.get('title'),
        "quantity": quantity,
        "amount": total_amount,
        "delivery_address": delivery_address
    }


def calculate_order_total(product_id: int, quantity: int):
    """
    Calculate the total cost for an order before placing it.
    
    Args:
        product_id (int): The ID of the product
        quantity (int): Number of items
        
    Returns:
        dict: Price breakdown including unit price, quantity, and total
    """
    data = load_sample_data()
    
    if not data:
        return {"error": "Unable to load data"}
    
    # Find the product
    product = None
    for p in data.get('products', []):
        if p.get('id') == product_id:
            product = p
            break
    
    if not product:
        return {"error": f"Product with ID {product_id} not found"}
    
    if quantity <= 0:
        return {"error": "Quantity must be greater than 0"}
    
    unit_price = product.get('price', 0)
    total = unit_price * quantity
    
    return {
        "product_name": product.get('title'),
        "unit_price": unit_price,
        "quantity": quantity,
        "amount": total
    }


# ==================== LANGCHAIN TOOL WRAPPERS ====================
@tool
def check_buyer_profile_tool(phone_number: str) -> str:
    """Check if a buyer profile exists by phone number.
    Use this at the start of conversation to check if buyer is returning customer.
    
    Args:
        phone_number: The buyer's phone number
    """
    result = check_buyer_profile(phone_number)
    return str(result)


@tool
def create_buyer_profile_tool(phone_number: str, name: str) -> str:
    """Create a new buyer profile with phone number and name.
    Use this when placing first order for a new buyer.
    
    Args:
        phone_number: The buyer's phone number
        name: The buyer's full name
    """
    result = create_buyer_profile(phone_number, name)
    return str(result)


@tool
def get_company_information(query: str) -> str:
    """Get company information including name, description, contact details, and address.
    Use this when user asks about the company or store.
    
    Args:
        query: User's question about the company
    """
    info = get_company_info()
    return str(info)


@tool
def browse_products(query: str) -> str:
    """Get all available products with IDs, names, descriptions, and prices.
    Use this when user wants to see what products are available or browse the catalog.
    
    Args:
        query: User's request to see products
    """
    catalog = get_product_catalog()
    return str(catalog)


@tool
def get_product_details(product_id: str) -> str:
    """Get detailed information about a specific product by its ID.
    
    Args:
        product_id: The ID of the product (e.g., "1", "2", "3")
    """
    try:
        product = get_product_by_id(int(product_id))
        return str(product)
    except Exception as e:
        return f"Error: {str(e)}"


@tool
def calculate_price(product_id: str, quantity: str) -> str:
    """Calculate total price for a product and quantity.
    
    Args:
        product_id: The ID of the product
        quantity: The quantity to calculate price for
    """
    try:
        total = calculate_order_total(int(product_id), int(quantity))
        return str(total)
    except Exception as e:
        return f"Error: {str(e)}"


@tool
def create_order(product_id: str, quantity: str, delivery_address: str, delivery_latitude: str, delivery_longitude: str) -> str:
    """Place an order for a product. Buyer name is automatically retrieved from profile.
    
    Args:
        product_id: The ID of the product to order
        quantity: How many units to order
        delivery_address: Complete delivery address
        delivery_latitude: Latitude of delivery location (e.g., "23.0225")
        delivery_longitude: Longitude of delivery location (e.g., "72.5714")
    """
    try:
        phone_number = current_user.get("phone_number")
        
        # Get buyer profile to retrieve name
        buyers_data = load_buyers_data()
        if phone_number not in buyers_data.get('buyers', {}):
            return "Error: Buyer profile not found. Please contact support."
        
        buyer_name = buyers_data['buyers'][phone_number].get('name')
        
        # Convert lat/lng to float
        lat = float(delivery_latitude)
        lng = float(delivery_longitude)
        
        result = place_order(int(product_id), int(quantity), buyer_name, delivery_address, lat, lng, phone_number)
        return str(result)
    except ValueError as e:
        return f"Error: Invalid coordinates format. Please provide valid latitude and longitude numbers."
    except Exception as e:
        return f"Error: {str(e)}"


@tool
def get_my_orders(query: str) -> str:
    """Get order history and status for the current user.
    Use this when user asks about their orders, order status, or order history.
    
    Args:
        query: User's question about orders
    """
    phone_number = current_user.get("phone_number")
    buyers_data = load_buyers_data()
    
    if phone_number not in buyers_data.get('buyers', {}):
        return "No orders found for this number. Would you like to place your first order?"
    
    buyer = buyers_data['buyers'][phone_number]
    orders = buyer.get('orders', [])
    
    if not orders:
        return f"Hi {buyer.get('name', 'there')}! You haven't placed any orders yet."
    
    orders_summary = f"Buyer: {buyer.get('name')}\nTotal Orders: {len(orders)}\n\n"
    for idx, order in enumerate(orders, 1):
        orders_summary += f"Order {idx}:\n"
        orders_summary += f"- Order ID: {order.get('id')}\n"
        orders_summary += f"- Date: {order.get('created_at')}\n"
        orders_summary += f"- Product: {order.get('product_name')}\n"
        orders_summary += f"- Quantity: {order.get('quantity')}\n"
        orders_summary += f"- Total: ₹{order.get('amount')}\n"
        orders_summary += f"- Status: {order.get('order_status', 'Pending')}\n"
        orders_summary += f"- Payment: {order.get('payment_status', 'Pending')}\n"
        orders_summary += f"- Delivery: {order.get('delivery_address')}\n\n"
    
    return orders_summary


# ==================== TEST FUNCTIONS ====================
if __name__ == "__main__":
    print("=== Testing Tool Functions ===\n")
    
    print("1. Company Info:")
    print(get_company_info())
    print("\n")
    
    print("2. Product Catalog:")
    print(get_product_catalog())
    print("\n")
    
    print("3. Get Product by ID (1):")
    print(get_product_by_id(1))
    print("\n")
    
    print("4. Calculate Order Total:")
    print(calculate_order_total(1, 3))
    print("\n")
    
    print("5. Place Order:")
    print(place_order(1, 2, "John Doe", "123 Main St, Springfield"))
