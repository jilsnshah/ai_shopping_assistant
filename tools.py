"""
Tool Functions for AI Shopping Assistant
This file contains all the functions that will be used as tools by the LangChain agent.
"""


from dotenv import load_dotenv
load_dotenv()
import json
import os
from datetime import datetime
from langchain.tools import tool

# Import Firebase database functions
try:
    from firebase_db import (
        load_buyers_data,
        save_buyers_data,
        load_seller_data,
        save_seller_data,
        get_buyer,
        update_buyer,
        add_buyer_order,
        update_buyer_cart,
        add_order
    )
    FIREBASE_ENABLED = True
except ImportError:
    print("Warning: Firebase module not available. Using JSON file fallback.")
    FIREBASE_ENABLED = False


# ==================== GLOBAL STATE ====================
current_user = {
    "phone_number": None,
}


def set_current_user(phone_number):
    """Set the current user's phone number"""
    global current_user
    current_user["phone_number"] = phone_number


def load_sample_data(seller_id="1"):
    """Load data from sellers database (Firebase or JSON fallback)"""
    if FIREBASE_ENABLED:
        return load_seller_data(seller_id)
    else:
        # JSON file fallback
        json_file_path = os.path.join('static', 'sellers_data.json')
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


# Load buyers data function is imported from firebase_db if available
if not FIREBASE_ENABLED:
    def load_buyers_data():
        """Load data from buyers_data.json file (fallback when Firebase not available)"""
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


if not FIREBASE_ENABLED:
    def save_buyers_data(data):
        """Save data to buyers_data.json file (fallback when Firebase not available)"""
        json_file_path = os.path.join('static', 'buyers_data.json')
        
        try:
            with open(json_file_path, 'w') as f:
                json.dump(data, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving buyers data: {e}")
            return False


def get_company_info(seller_id="1"):
    """
    Get company name and description.
    
    Returns:
        dict: Company information including name and description
    """
    data = load_sample_data(seller_id)
    
    if not data or not data.get('company_info'):
        return {"error": "No company information found"}
    
    company = data['company_info']
    
    return {
        "company_name": company.get('company_name', ''),
        "company_description": company.get('company_description', ''),
        "owner_name": company.get('owner_name', ''),
        "phone": company.get('phone', ''),
        "email": company.get('email', ''),
        "address": company.get('address', '')
    }


def get_product_catalog(seller_id="1"):
    """
    Get all products with their details including description and price.
    
    Args:
        seller_id (str): Seller ID to load products for (default: "1")
    
    Returns:
        list: List of products with id, title, description, and price
    """
    data = load_sample_data(seller_id)
    
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


def get_product_by_id(product_id: int, seller_id="1"):
    """
    Get specific product details by product ID.
    
    Args:
        product_id (int): The ID of the product
        seller_id (str): Seller ID to load product from (default: "1")
        
    Returns:
        dict: Product information or error message
    """
    data = load_sample_data(seller_id)
    
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
        "orders": [],
        "cart": []
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


def update_buyer_name(phone_number: str, new_name: str):
    """
    Update buyer's name in their profile.
    
    Args:
        phone_number (str): The buyer's phone number
        new_name (str): The new name to set
        
    Returns:
        dict: Success status and updated profile
    """
    buyers_data = load_buyers_data()
    
    # Check if buyer profile exists
    if phone_number not in buyers_data.get('buyers', {}):
        return {
            "success": False,
            "error": "Buyer profile not found. Please create a profile first."
        }
    
    # Update the name
    buyers_data['buyers'][phone_number]['name'] = new_name
    
    # Save to file
    if save_buyers_data(buyers_data):
        return {
            "success": True,
            "message": f"Name successfully updated to '{new_name}'.",
            "buyer": buyers_data['buyers'][phone_number]
        }
    else:
        return {
            "success": False,
            "error": "Failed to update buyer name"
        }


def add_to_cart(phone_number: str, product_id: int, quantity: int, seller_id="1"):
    """
    Add a product to buyer's cart or update quantity if already exists.
    
    Args:
        phone_number (str): Buyer's phone number
        product_id (int): Product ID to add
        quantity (int): Quantity to add
        seller_id (str): Seller ID to load product from (default: "1")
        
    Returns:
        dict: Success status and cart info
    """
    buyers_data = load_buyers_data()
    
    if phone_number not in buyers_data.get('buyers', {}):
        return {"error": "Buyer profile not found"}
    
    # Get product details
    seller_data = load_sample_data(seller_id)
    product = None
    for p in seller_data.get('products', []):
        if p.get('id') == product_id:
            product = p
            break
    
    if not product:
        return {"error": f"Product with ID {product_id} not found"}
    
    buyer = buyers_data['buyers'][phone_number]
    
    # Initialize cart if not exists
    if 'cart' not in buyer:
        buyer['cart'] = []
    
    # Check if product already in cart
    item_found = False
    for item in buyer['cart']:
        if item['product_id'] == product_id:
            item['quantity'] += quantity
            item['subtotal'] = item['quantity'] * item['unit_price']
            item_found = True
            break
    
    # Add new item if not found
    if not item_found:
        buyer['cart'].append({
            "product_id": product_id,
            "product_name": product.get('title'),
            "quantity": quantity,
            "unit_price": product.get('price'),
            "subtotal": quantity * product.get('price')
        })
    
    # Save
    if save_buyers_data(buyers_data):
        return {
            "success": True,
            "message": f"Added {quantity} x {product.get('title')} to cart",
            "cart": buyer['cart']
        }
    else:
        return {"error": "Failed to save cart"}


def get_cart(phone_number: str):
    """
    Get buyer's current cart.
    
    Args:
        phone_number (str): Buyer's phone number
        
    Returns:
        dict: Cart items and total
    """
    buyers_data = load_buyers_data()
    
    if phone_number not in buyers_data.get('buyers', {}):
        return {"error": "Buyer profile not found"}
    
    buyer = buyers_data['buyers'][phone_number]
    cart = buyer.get('cart', [])
    
    if not cart:
        return {
            "empty": True,
            "message": "Your cart is empty",
            "items": [],
            "total": 0
        }
    
    total = sum(item['subtotal'] for item in cart)
    
    return {
        "empty": False,
        "items": cart,
        "total": total,
        "item_count": len(cart)
    }


def update_cart_item(phone_number: str, product_id: int, quantity: int):
    """
    Update quantity of a cart item or remove if quantity is 0.
    
    Args:
        phone_number (str): Buyer's phone number
        product_id (int): Product ID to update
        quantity (int): New quantity (0 to remove)
        
    Returns:
        dict: Success status
    """
    buyers_data = load_buyers_data()
    
    if phone_number not in buyers_data.get('buyers', {}):
        return {"error": "Buyer profile not found"}
    
    buyer = buyers_data['buyers'][phone_number]
    cart = buyer.get('cart', [])
    
    if quantity == 0:
        # Remove item
        buyer['cart'] = [item for item in cart if item['product_id'] != product_id]
        message = "Item removed from cart"
    else:
        # Update quantity
        item_found = False
        for item in cart:
            if item['product_id'] == product_id:
                item['quantity'] = quantity
                item['subtotal'] = quantity * item['unit_price']
                item_found = True
                break
        
        if not item_found:
            return {"error": "Item not found in cart"}
        
        message = "Cart updated"
    
    if save_buyers_data(buyers_data):
        return {
            "success": True,
            "message": message,
            "cart": buyer['cart']
        }
    else:
        return {"error": "Failed to update cart"}


def clear_cart(phone_number: str):
    """
    Clear all items from buyer's cart.
    
    Args:
        phone_number (str): Buyer's phone number
        
    Returns:
        dict: Success status
    """
    buyers_data = load_buyers_data()
    
    if phone_number not in buyers_data.get('buyers', {}):
        return {"error": "Buyer profile not found"}
    
    buyer = buyers_data['buyers'][phone_number]
    buyer['cart'] = []
    
    if save_buyers_data(buyers_data):
        return {
            "success": True,
            "message": "Cart cleared"
        }
    else:
        return {"error": "Failed to clear cart"}


def place_order(buyer_phone: str, delivery_address: str, delivery_lat: float, delivery_lng: float, seller_id="1"):
    """
    Place an order from buyer's cart (multi-item order).
    
    Args:
        buyer_phone (str): Phone number of the buyer
        delivery_address (str): Delivery address for the order
        delivery_lat (float): Latitude of delivery location
        delivery_lng (float): Longitude of delivery location
        seller_id (str): Seller ID to place order with (default: "1")
        
    Returns:
        dict: Order confirmation with order details
    """
    # Load buyer data
    buyers_data = load_buyers_data()
    
    if buyer_phone not in buyers_data.get('buyers', {}):
        return {"error": "Buyer profile not found"}
    
    buyer = buyers_data['buyers'][buyer_phone]
    cart = buyer.get('cart', [])
    
    if not cart:
        return {"error": "Cart is empty. Please add items to cart first."}
    
    # Load seller data
    seller_data = load_sample_data(seller_id)
    
    if not seller_data:
        return {"error": "Unable to load seller data"}
    
    # Generate order ID
    order_id = len(seller_data.get('orders', [])) + 1
    
    # Create timestamp
    timestamp = datetime.now().isoformat()
    
    # Calculate total
    total_amount = sum(item['subtotal'] for item in cart)
    
    # Create new multi-item order structure
    order = {
        "order_id": order_id,
        "seller_id": int(seller_id) if seller_id.isdigit() else 1,
        "buyer_name": buyer.get('name'),
        "buyer_phone": buyer_phone,
        "delivery_address": delivery_address,
        "delivery_lat": delivery_lat,
        "delivery_lng": delivery_lng,
        "payment_status": "Pending",
        "order_status": "Received",
        "created_at": timestamp,
        "items": cart.copy(),  # Copy cart items to order
        "total_amount": total_amount
    }
    
    # Save to seller database
    if FIREBASE_ENABLED:
        if not add_order(seller_id, order):
            return {
                "error": "Order created but failed to save to seller DB",
                "order_details": order
            }
    else:
        # JSON fallback
        if 'orders' not in seller_data:
            seller_data['orders'] = []
        seller_data['orders'].append(order)
        
        json_file_path = os.path.join('static', 'sellers_data.json')
        try:
            with open(json_file_path, 'w') as f:
                json.dump(seller_data, f, indent=2)
        except Exception as e:
            return {
                "error": f"Order created but failed to save to seller DB: {str(e)}",
                "order_details": order
            }
    
    # Add order to buyer's orders
    if 'orders' not in buyer:
        buyer['orders'] = []
    buyer['orders'].append(order)
    
    # Clear cart after successful order
    buyer['cart'] = []
    
    # Save buyers data
    if not save_buyers_data(buyers_data):
        print("Warning: Failed to save to buyer database")
    
    # Format item list for response
    items_summary = ", ".join([f"{item['quantity']}x {item['product_name']}" for item in cart])
    
    return {
        "success": True,
        "message": f"Order placed successfully! Order ID: {order_id}. Total: ₹{total_amount:.2f}",
        "order_id": order_id,
        "items": items_summary,
        "total_amount": total_amount,
        "delivery_address": delivery_address
    }


def calculate_order_total(product_id: int, quantity: int, seller_id="1"):
    """
    Calculate the total cost for an order before placing it.
    
    Args:
        product_id (int): The ID of the product
        quantity (int): Number of items
        seller_id (str): Seller ID to load product from (default: "1")
        
    Returns:
        dict: Price breakdown including unit price, quantity, and total
    """
    data = load_sample_data(seller_id)
    
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
    This is automatically called by the system when needed.
    
    Args:
        phone_number: The buyer's phone number
        name: The buyer's full name
    """
    result = create_buyer_profile(phone_number, name)
    return str(result)


@tool
def update_my_name(new_name: str) -> str:
    """Update the buyer's name in their profile.
    Use this when customer wants to change or update their name.
    
    Args:
        new_name: The new name for the buyer
    """
    phone_number = current_user.get("phone_number")
    result = update_buyer_name(phone_number, new_name)
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
    catalog = get_product_catalog(seller_id="1")
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
def add_product_to_cart(product_id: str, quantity: str) -> str:
    """Add a product to the shopping cart. If product already exists in cart, quantity will be updated.
    
    Args:
        product_id: The ID of the product to add (e.g., "1", "2", "3")
        quantity: How many units to add (e.g., "2", "5")
    """
    try:
        phone_number = current_user.get("phone_number")
        result = add_to_cart(phone_number, int(product_id), int(quantity), seller_id="1")
        return str(result)
    except Exception as e:
        return f"Error: {str(e)}"


@tool
def view_shopping_cart(query: str) -> str:
    """View all items in the shopping cart with quantities, prices, and total amount.
    Use this when user wants to see what's in their cart or review cart before checkout.
    
    Args:
        query: User's request to view cart
    """
    try:
        phone_number = current_user.get("phone_number")
        result = get_cart(phone_number)
        return str(result)
    except Exception as e:
        return f"Error: {str(e)}"


@tool
def modify_cart_item(product_id: str, quantity: str) -> str:
    """Update quantity of a product in cart or remove it (set quantity to 0 to remove).
    
    Args:
        product_id: The ID of the product in cart
        quantity: New quantity (use "0" to remove item from cart)
    """
    try:
        phone_number = current_user.get("phone_number")
        result = update_cart_item(phone_number, int(product_id), int(quantity))
        return str(result)
    except Exception as e:
        return f"Error: {str(e)}"


@tool
def empty_shopping_cart(query: str) -> str:
    """Clear all items from the shopping cart.
    Use this when user wants to start over or empty their cart.
    
    Args:
        query: User's request to clear cart
    """
    try:
        phone_number = current_user.get("phone_number")
        result = clear_cart(phone_number)
        return str(result)
    except Exception as e:
        return f"Error: {str(e)}"


@tool
def create_order(delivery_address: str, delivery_latitude: str, delivery_longitude: str) -> str:
    """Place an order with all items from shopping cart. Cart will be automatically cleared after successful order.
    IMPORTANT: User must have items in cart before placing order.
    
    Args:
        delivery_address: Complete delivery address
        delivery_latitude: Latitude of delivery location (e.g., "23.0225")
        delivery_longitude: Longitude of delivery location (e.g., "72.5714")
    """
    try:
        phone_number = current_user.get("phone_number")
        
        # Convert lat/lng to float
        lat = float(delivery_latitude)
        lng = float(delivery_longitude)
        
        result = place_order(phone_number, delivery_address, lat, lng, seller_id="1")
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
        order_id = order.get('order_id', order.get('id'))
        total_amount = order.get('total_amount', order.get('amount'))
        
        orders_summary += f"Order {idx}:\n"
        orders_summary += f"- Order ID: {order_id}\n"
        orders_summary += f"- Date: {order.get('created_at')}\n"
        
        # Handle multi-item orders
        if 'items' in order and order['items']:
            orders_summary += f"- Items:\n"
            for item in order['items']:
                orders_summary += f"  * {item['product_name']} x{item['quantity']} - ₹{item['subtotal']}\n"
            orders_summary += f"- Total: ₹{total_amount}\n"
        else:
            # Old single-item structure fallback
            orders_summary += f"- Product: {order.get('product_name')}\n"
            orders_summary += f"- Quantity: {order.get('quantity')}\n"
            orders_summary += f"- Total: ₹{total_amount}\n"
        
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
