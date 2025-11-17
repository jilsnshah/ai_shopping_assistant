"""
Tool Functions for AI Shopping Assistant
This file contains all the functions that will be used as tools by the LangChain agent.
"""

import json
import os
from datetime import datetime


def load_sample_data():
    """Load data from sample_data.json file"""
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


def place_order(product_id: int, quantity: int, buyer_name: str, delivery_address: str):
    """
    Place an order for a product and save it to the JSON file.
    
    Args:
        product_id (int): The ID of the product to order
        quantity (int): Number of items to order
        buyer_name (str): Name of the buyer
        delivery_address (str): Delivery address for the order
        
    Returns:
        dict: Order confirmation with order details
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
    
    # Validate quantity
    if quantity <= 0:
        return {"error": "Quantity must be greater than 0"}
    
    # Calculate total amount
    total_amount = product.get('price', 0) * quantity
    
    # Get seller_id from product
    seller_id = product.get('seller_id', 1)
    
    # Create new order
    order = {
        "id": len(data.get('orders', [])) + 1,
        "seller_id": seller_id,
        "product_id": product_id,
        "product_name": product.get('title'),
        "quantity": quantity,
        "buyer_name": buyer_name,
        "delivery_address": delivery_address,
        "unit_price": product.get('price'),
        "amount": total_amount,
        "payment_status": "Pending",
        "order_status": "Received",
        "created_at": datetime.now().isoformat()
    }
    
    # Add order to data
    if 'orders' not in data:
        data['orders'] = []
    data['orders'].append(order)
    
    # Save updated data back to JSON file
    json_file_path = os.path.join('static', 'sample_data.json')
    try:
        with open(json_file_path, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        return {
            "error": f"Order created but failed to save: {str(e)}",
            "order_details": order
        }
    
    return {
        "success": True,
        "message": "Order placed successfully and saved!",
        "order_details": order
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
        "total_amount": total
    }


# Test functions
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
