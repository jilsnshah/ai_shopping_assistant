"""
Firebase Realtime Database Integration
Handles all database operations for buyers, sellers, and agent memory
"""


from dotenv import load_dotenv
load_dotenv()
import firebase_admin
from firebase_admin import credentials, db
import json
import os
from datetime import datetime

def sanitize_email_for_firebase(email):
    """
    Sanitize email to be used as Firebase path key.
    Firebase doesn't allow . $ # [ ] / characters in keys.
    """
    if not email:
        return email
    # Replace special characters with safe alternatives
    sanitized = email.replace('.', '_dot_').replace('@', '_at_').replace('/', '_slash_')
    return sanitized

def unsanitize_email(sanitized_email):
    """
    Convert sanitized email back to original format.
    """
    if not sanitized_email:
        return sanitized_email
    return sanitized_email.replace('_dot_', '.').replace('_at_', '@').replace('_slash_', '/')


# Initialize Firebase (only once)
_firebase_initialized = False

def initialize_firebase():
    """Initialize Firebase Admin SDK with credentials"""
    global _firebase_initialized
    
    if _firebase_initialized:
        return
    
    # Check if Firebase credentials file exists
    cred_path = os.path.join(os.path.dirname(__file__), 'firebase-credentials.json')
    
    if not os.path.exists(cred_path):
        print(f"Warning: Firebase credentials file not found at {cred_path}")
        print("Please download your Firebase service account key and save it as 'firebase-credentials.json'")
        return
    
    # Initialize Firebase
    cred = credentials.Certificate(cred_path)
    
    # Get database URL from credentials or use environment variable
    try:
        with open(cred_path, 'r') as f:
            cred_data = json.load(f)
            project_id = cred_data.get('project_id')
            database_url = f'https://{project_id}-default-rtdb.firebaseio.com/'
    except:
        database_url = os.environ.get('FIREBASE_DATABASE_URL')
    
    firebase_admin.initialize_app(cred, {
        'databaseURL': database_url
    })
    
    _firebase_initialized = True
    print(f"Firebase initialized successfully with database: {database_url}")


# ==================== BUYERS DATA ====================

def get_buyers_ref():
    """Get reference to buyers node in Firebase"""
    return db.reference('buyers')


def load_buyers_data():
    """
    Load all buyers data from Firebase.
    Returns dict with 'buyers' key containing buyer profiles.
    """
    try:
        initialize_firebase()
        buyers_ref = get_buyers_ref()
        buyers = buyers_ref.get()
        
        if buyers is None:
            return {"buyers": {}}
        
        return {"buyers": buyers}
    except Exception as e:
        print(f"Error loading buyers data from Firebase: {e}")
        # Fallback to JSON file if Firebase fails
        return load_buyers_data_from_json()


def save_buyers_data(buyers_data):
    """
    Save buyers data to Firebase.
    
    Args:
        buyers_data (dict): Dictionary with 'buyers' key
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        initialize_firebase()
        buyers_ref = get_buyers_ref()
        buyers_ref.set(buyers_data.get('buyers', {}))
        return True
    except Exception as e:
        print(f"Error saving buyers data to Firebase: {e}")
        # Fallback to JSON file if Firebase fails
        return save_buyers_data_to_json(buyers_data)


def get_buyer(phone_number):
    """Get a single buyer's data by phone number"""
    try:
        initialize_firebase()
        buyer_ref = db.reference(f'buyers/{phone_number}')
        return buyer_ref.get()
    except Exception as e:
        print(f"Error getting buyer from Firebase: {e}")
        return None


def update_buyer(phone_number, buyer_data):
    """Update a single buyer's data"""
    try:
        initialize_firebase()
        buyer_ref = db.reference(f'buyers/{phone_number}')
        buyer_ref.set(buyer_data)
        return True
    except Exception as e:
        print(f"Error updating buyer in Firebase: {e}")
        return False


def add_buyer_order(phone_number, order):
    """Add an order to a buyer's order history"""
    try:
        initialize_firebase()
        orders_ref = db.reference(f'buyers/{phone_number}/orders')
        orders = orders_ref.get() or []
        orders.append(order)
        orders_ref.set(orders)
        return True
    except Exception as e:
        print(f"Error adding order to buyer in Firebase: {e}")
        return False


def update_buyer_cart(phone_number, cart):
    """Update a buyer's shopping cart"""
    try:
        initialize_firebase()
        cart_ref = db.reference(f'buyers/{phone_number}/cart')
        cart_ref.set(cart)
        return True
    except Exception as e:
        print(f"Error updating buyer cart in Firebase: {e}")
        return False


# ==================== SELLERS DATA ====================

def get_sellers_ref():
    """Get reference to sellers node in Firebase"""
    return db.reference('sellers')


def load_seller_data(seller_id):
    """
    Load specific seller data from Firebase by seller ID.
    Returns dict with 'company_info', 'products', and 'orders' keys.
    """
    try:
        initialize_firebase()
        # Sanitize email for Firebase path (emails contain . and @ which are not allowed)
        safe_seller_id = sanitize_email_for_firebase(seller_id)
        seller_ref = db.reference(f'sellers/{safe_seller_id}')
        data = seller_ref.get()
        
        if data is None:
            return {
                "company_info": {},
                "products": [],
                "orders": []
            }
        
        return data
    except Exception as e:
        print(f"Error loading seller {seller_id} data from Firebase: {e}")
        return {
            "company_info": {},
            "products": [],
            "orders": []
        }


def load_sellers_data():
    """
    Load all sellers data from Firebase (for backward compatibility).
    Returns dict with all seller IDs.
    """
    try:
        initialize_firebase()
        sellers_ref = db.reference('sellers')
        data = sellers_ref.get()
        
        if data is None:
            return {}
        
        return data
    except Exception as e:
        print(f"Error loading sellers data from Firebase: {e}")
        return {}


def save_seller_data(seller_id, seller_data):
    """
    Save specific seller data to Firebase.
    
    Args:
        seller_id (str): Seller ID
        seller_data (dict): Dictionary with 'company_info', 'products', 'orders' keys
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        initialize_firebase()
        # Sanitize email for Firebase path (emails contain . and @ which are not allowed)
        safe_seller_id = sanitize_email_for_firebase(seller_id)
        seller_ref = db.reference(f'sellers/{safe_seller_id}')
        seller_ref.set(seller_data)
        return True
    except Exception as e:
        print(f"Error saving seller {seller_id} data to Firebase: {e}")
        return False


def save_sellers_data(sellers_data):
    """
    Save all sellers data to Firebase (for backward compatibility).
    
    Args:
        sellers_data (dict): Dictionary with all seller IDs
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        initialize_firebase()
        sellers_ref = db.reference('sellers')
        sellers_ref.set(sellers_data)
        return True
    except Exception as e:
        print(f"Error saving sellers data to Firebase: {e}")
        return False


def add_order(seller_id, order):
    """Add a new order to specific seller's orders list"""
    try:
        initialize_firebase()
        orders_ref = db.reference(f'sellers/{seller_id}/orders')
        orders = orders_ref.get() or []
        orders.append(order)
        orders_ref.set(orders)
        return True
    except Exception as e:
        print(f"Error adding order to Firebase: {e}")
        return False


def update_order_status(seller_id, order_id, order_status=None, payment_status=None):
    """Update order status in Firebase for specific seller"""
    try:
        initialize_firebase()
        safe_seller_id = sanitize_email_for_firebase(seller_id)
        orders_ref = db.reference(f'sellers/{safe_seller_id}/orders')
        orders = orders_ref.get() or []
        
        for i, order in enumerate(orders):
            if order.get('order_id') == order_id or order.get('id') == order_id:
                if order_status:
                    orders[i]['order_status'] = order_status
                if payment_status:
                    orders[i]['payment_status'] = payment_status
                orders_ref.set(orders)
                return True
        
        return False
    except Exception as e:
        print(f"Error updating order status in Firebase: {e}")
        return False


# ==================== RAZORPAY INTEGRATION ====================

def save_razorpay_credentials(seller_id, api_key, api_secret, enabled=True):
    """
    Save Razorpay credentials to Firebase
    
    Args:
        seller_id (str): Seller ID
        api_key (str): Razorpay API key
        api_secret (str): Razorpay API secret
        enabled (bool): Whether Razorpay is enabled
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        initialize_firebase()
        safe_seller_id = sanitize_email_for_firebase(seller_id)
        credentials_ref = db.reference(f'sellers/{safe_seller_id}/razorpay_credentials')
        
        credentials = {
            'api_key': api_key,
            'api_secret': api_secret,
            'enabled': enabled
        }
        
        credentials_ref.set(credentials)
        print(f"✅ Razorpay credentials saved for seller {seller_id}")
        return True
    except Exception as e:
        print(f"❌ Error saving Razorpay credentials: {e}")
        return False


def get_razorpay_credentials(seller_id):
    """
    Get Razorpay credentials from Firebase
    
    Args:
        seller_id (str): Seller ID
        
    Returns:
        dict: Credentials dict with 'api_key', 'api_secret', 'enabled' or None
    """
    try:
        initialize_firebase()
        safe_seller_id = sanitize_email_for_firebase(seller_id)
        credentials_ref = db.reference(f'sellers/{safe_seller_id}/razorpay_credentials')
        credentials = credentials_ref.get()
        return credentials
    except Exception as e:
        print(f"❌ Error getting Razorpay credentials: {e}")
        return None


def update_order_payment_link(seller_id, order_id, payment_link_id):
    """
    Update order with Razorpay payment link ID
    
    Args:
        seller_id (str): Seller ID
        order_id (int): Order ID
        payment_link_id (str): Razorpay payment link ID
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        initialize_firebase()
        safe_seller_id = sanitize_email_for_firebase(seller_id)
        orders_ref = db.reference(f'sellers/{safe_seller_id}/orders')
        orders = orders_ref.get() or []
        
        for i, order in enumerate(orders):
            if order.get('order_id') == order_id or order.get('id') == order_id:
                orders[i]['payment_link_id'] = payment_link_id
                orders_ref.set(orders)
                print(f"✅ Payment link ID saved for order {order_id}")
                return True
        
        print(f"⚠️ Order {order_id} not found")
        return False
    except Exception as e:
        print(f"❌ Error updating order payment link: {e}")
        return False


# ==================== WORKFLOW AUTOMATION ====================

def save_workflow_config(seller_id, workflow_config):
    """
    Save workflow automation configuration to Firebase
    
    Args:
        seller_id (str): Seller ID
        workflow_config (dict): Workflow configuration with 'blocks' key
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        initialize_firebase()
        safe_seller_id = sanitize_email_for_firebase(seller_id)
        workflow_ref = db.reference(f'sellers/{safe_seller_id}/workflow_config')
        workflow_ref.set(workflow_config)
        print(f"✅ Workflow configuration saved for seller {seller_id}")
        return True
    except Exception as e:
        print(f"❌ Error saving workflow configuration: {e}")
        return False


def get_workflow_config(seller_id):
    """
    Get workflow automation configuration from Firebase
    
    Args:
        seller_id (str): Seller ID
        
    Returns:
        dict: Workflow configuration or None
    """
    try:
        initialize_firebase()
        safe_seller_id = sanitize_email_for_firebase(seller_id)
        workflow_ref = db.reference(f'sellers/{safe_seller_id}/workflow_config')
        workflow_config = workflow_ref.get()
        return workflow_config
    except Exception as e:
        print(f"❌ Error getting workflow configuration: {e}")
        return None


# ==================== CANCELLATION MANAGEMENT ====================

def get_cancellation_requests(seller_id):
    """
    Get all pending cancellation requests for a seller
    
    Args:
        seller_id (str): Seller ID
        
    Returns:
        list: List of orders with cancellation requests
    """
    try:
        initialize_firebase()
        safe_seller_id = sanitize_email_for_firebase(seller_id)
        
        # Get cancellation order IDs
        cancellation_ref = db.reference(f'sellers/{safe_seller_id}/cancellation')
        cancellation_order_ids = cancellation_ref.get() or []
        
        if not cancellation_order_ids:
            return []
        
        # Get full order details for these order IDs
        orders_ref = db.reference(f'sellers/{safe_seller_id}/orders')
        all_orders = orders_ref.get() or []
        
        # Filter orders by cancellation requests
        cancellation_requests = []
        for order in all_orders:
            order_id = order.get('order_id') or order.get('id')
            if order_id in cancellation_order_ids:
                cancellation_requests.append(order)
        
        print(f"✅ Found {len(cancellation_requests)} cancellation requests for seller {seller_id}")
        return cancellation_requests
        
    except Exception as e:
        print(f"❌ Error getting cancellation requests: {e}")
        return []


def approve_cancellation_request(seller_id, order_id):
    """
    Approve cancellation request and delete order
    
    Args:
        seller_id (str): Seller ID
        order_id (int): Order ID
        
    Returns:
        dict: Result with 'success' and 'order' keys, or None on failure
    """
    try:
        initialize_firebase()
        safe_seller_id = sanitize_email_for_firebase(seller_id)
        
        # Get the order before deleting
        orders_ref = db.reference(f'sellers/{safe_seller_id}/orders')
        all_orders = orders_ref.get() or []
        
        order_to_delete = None
        remaining_orders = []
        
        for order in all_orders:
            if order.get('order_id') == order_id or order.get('id') == order_id:
                order_to_delete = order
            else:
                remaining_orders.append(order)
        
        if not order_to_delete:
            print(f"⚠️ Order {order_id} not found")
            return None
        
        # Delete order from orders list
        orders_ref.set(remaining_orders)
        
        # Remove from cancellation list
        cancellation_ref = db.reference(f'sellers/{safe_seller_id}/cancellation')
        cancellation_order_ids = cancellation_ref.get() or []
        
        if order_id in cancellation_order_ids:
            cancellation_order_ids.remove(order_id)
            cancellation_ref.set(cancellation_order_ids)
        
        print(f"✅ Cancellation approved and order {order_id} deleted for seller {seller_id}")
        return {'success': True, 'order': order_to_delete}
        
    except Exception as e:
        print(f"❌ Error approving cancellation: {e}")
        return None


def reject_cancellation_request(seller_id, order_id):
    """
    Reject cancellation request (keep order, remove from cancellation list)
    
    Args:
        seller_id (str): Seller ID
        order_id (int): Order ID
        
    Returns:
        dict: Result with 'success' and 'order' keys, or None on failure
    """
    try:
        initialize_firebase()
        safe_seller_id = sanitize_email_for_firebase(seller_id)
        
        # Get the order
        orders_ref = db.reference(f'sellers/{safe_seller_id}/orders')
        all_orders = orders_ref.get() or []
        
        order_found = None
        for order in all_orders:
            if order.get('order_id') == order_id or order.get('id') == order_id:
                order_found = order
                break
        
        if not order_found:
            print(f"⚠️ Order {order_id} not found")
            return None
        
        # Remove from cancellation list (order stays in orders)
        cancellation_ref = db.reference(f'sellers/{safe_seller_id}/cancellation')
        cancellation_order_ids = cancellation_ref.get() or []
        
        if order_id in cancellation_order_ids:
            cancellation_order_ids.remove(order_id)
            cancellation_ref.set(cancellation_order_ids)
        
        print(f"✅ Cancellation rejected for order {order_id}, seller {seller_id}")
        return {'success': True, 'order': order_found}
        
    except Exception as e:
        print(f"❌ Error rejecting cancellation: {e}")
        return None


def request_order_cancellation(order_id):
    """
    Request cancellation for an order by adding it to seller's cancellation list.
    This is called when a buyer wants to cancel their order.
    
    Args:
        order_id (int): Order ID to cancel
        
    Returns:
        dict: Result with 'success' and 'message' keys
    """
    try:
        initialize_firebase()
        
        # First, find which seller this order belongs to
        sellers_ref = db.reference('sellers')
        all_sellers = sellers_ref.get() or {}
        
        seller_id_found = None
        order_found = None
        
        # Search through all sellers to find the order
        for seller_id, seller_data in all_sellers.items():
            orders = seller_data.get('orders', [])
            for order in orders:
                if order.get('order_id') == order_id or order.get('id') == order_id:
                    seller_id_found = seller_id
                    order_found = order
                    break
            if order_found:
                break
        
        if not order_found:
            print(f"⚠️ Order {order_id} not found")
            return {
                'success': False,
                'message': f'Order with ID {order_id} not found'
            }
        
        # Add order ID to seller's cancellation list
        cancellation_ref = db.reference(f'sellers/{seller_id_found}/cancellation')
        cancellation_order_ids = cancellation_ref.get() or []
        
        # Check if already requested
        if order_id in cancellation_order_ids:
            return {
                'success': True,
                'message': f'Cancellation for order #{order_id} has already been requested',
                'already_requested': True
            }
        
        # Add to cancellation list
        cancellation_order_ids.append(order_id)
        cancellation_ref.set(cancellation_order_ids)
        
        print(f"✅ Cancellation requested for order {order_id}, seller {seller_id_found}")
        return {
            'success': True,
            'message': f'Cancellation request submitted for order #{order_id}. The seller will review your request and get back to you soon.',
            'order_id': order_id,
            'seller_id': seller_id_found
        }
        
    except Exception as e:
        print(f"❌ Error requesting order cancellation: {e}")
        return {
            'success': False,
            'message': f'Failed to submit cancellation request: {str(e)}'
        }



# ==================== CONVERSATION HISTORY ====================

def save_conversation_message(seller_id, buyer_phone, role, content):
    """
    Save a conversation message to Firebase
    Keeps only last 10 messages per buyer
    
    Args:
        seller_id (str): Seller ID
        buyer_phone (str): Buyer's phone number
        role (str): 'user' or 'assistant'
        content (str): Message content
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        initialize_firebase()
        safe_seller_id = sanitize_email_for_firebase(seller_id)
        safe_buyer_id = sanitize_email_for_firebase(buyer_phone)
        
        # Reference to conversation history
        conv_ref = db.reference(f'sellers/{safe_seller_id}/conv_history/{safe_buyer_id}')
        
        # Get existing messages
        existing_messages = conv_ref.get() or {}
        
        # Create new message
        import time
        timestamp = int(time.time() * 1000)  # milliseconds
        message_id = f"msg_{timestamp}"
        
        new_message = {
            "timestamp": timestamp,
            "role": role,
            "content": content
        }
        
        # Add new message
        existing_messages[message_id] = new_message
        
        # Keep only last 10 messages
        sorted_messages = sorted(existing_messages.items(), key=lambda x: x[1]['timestamp'])
        if len(sorted_messages) > 10:
            sorted_messages = sorted_messages[-10:]
        
        # Save back to Firebase
        trimmed_messages = {msg_id: msg_data for msg_id, msg_data in sorted_messages}
        conv_ref.set(trimmed_messages)
        
        print(f"✅ Saved {role} message to Firebase for {buyer_phone}")
        return True
        
    except Exception as e:
        print(f"❌ Error saving conversation message: {e}")
        return False


def get_conversation_history(seller_id, buyer_phone, limit=10):
    """
    Get conversation history for a buyer
    
    Args:
        seller_id (str): Seller ID
        buyer_phone (str): Buyer's phone number
        limit (int): Maximum number of messages to retrieve (default: 10)
        
    Returns:
        list: List of messages [{role, content}, ...] ordered by timestamp
    """
    try:
        initialize_firebase()
        safe_seller_id = sanitize_email_for_firebase(seller_id)
        safe_buyer_id = sanitize_email_for_firebase(buyer_phone)
        
        # Reference to conversation history
        conv_ref = db.reference(f'sellers/{safe_seller_id}/conv_history/{safe_buyer_id}')
        
        # Get all messages
        all_messages = conv_ref.get() or {}
        
        if not all_messages:
            return []
        
        # Sort by timestamp and limit
        sorted_messages = sorted(all_messages.items(), key=lambda x: x[1]['timestamp'])
        sorted_messages = sorted_messages[-limit:]
        
        # Format for agent
        messages = []
        for msg_id, msg_data in sorted_messages:
            messages.append({
                "role": msg_data["role"],
                "content": msg_data["content"]
            })
        
        print(f"✅ Retrieved {len(messages)} messages from Firebase for {buyer_phone}")
        return messages
        
    except Exception as e:
        print(f"❌ Error getting conversation history: {e}")
        return []


def clear_conversation_history(seller_id, buyer_phone):
    """
    Clear conversation history for a buyer
    
    Args:
        seller_id (str): Seller ID
        buyer_phone (str): Buyer's phone number
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        initialize_firebase()
        safe_seller_id = sanitize_email_for_firebase(seller_id)
        safe_buyer_id = sanitize_email_for_firebase(buyer_phone)
        
        # Reference to conversation history
        conv_ref = db.reference(f'sellers/{safe_seller_id}/conv_history/{safe_buyer_id}')
        conv_ref.delete()
        
        print(f"✅ Cleared conversation history for {buyer_phone}")
        return True
        
    except Exception as e:
        print(f"❌ Error clearing conversation history: {e}")
        return False


# ==================== AGENT MEMORY ====================

def get_agent_memory_ref():
    """Get reference to agent_memory node in Firebase"""
    return db.reference('agent_memory')


def save_agent_memory(phone_number, memory_data):
    """
    Save agent conversation memory for a specific buyer.
    
    Args:
        phone_number (str): Buyer's phone number
        memory_data (dict): Conversation memory data
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        initialize_firebase()
        memory_ref = db.reference(f'agent_memory/{phone_number}')
        memory_ref.set(memory_data)
        return True
    except Exception as e:
        print(f"Error saving agent memory to Firebase: {e}")
        return False


def load_agent_memory(phone_number):
    """
    Load agent conversation memory for a specific buyer.
    
    Args:
        phone_number (str): Buyer's phone number
        
    Returns:
        dict: Memory data or None if not found
    """
    try:
        initialize_firebase()
        memory_ref = db.reference(f'agent_memory/{phone_number}')
        return memory_ref.get()
    except Exception as e:
        print(f"Error loading agent memory from Firebase: {e}")
        return None


def clear_agent_memory(phone_number):
    """Clear agent memory for a specific buyer"""
    try:
        initialize_firebase()
        memory_ref = db.reference(f'agent_memory/{phone_number}')
        memory_ref.delete()
        return True
    except Exception as e:
        print(f"Error clearing agent memory in Firebase: {e}")
        return False


# ==================== JSON FALLBACK FUNCTIONS ====================

def load_buyers_data_from_json():
    """Fallback: Load buyers data from JSON file"""
    json_path = os.path.join(os.path.dirname(__file__), 'static', 'buyers_data.json')
    try:
        with open(json_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"buyers": {}}
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in {json_path}")
        return {"buyers": {}}


def save_buyers_data_to_json(buyers_data):
    """Fallback: Save buyers data to JSON file"""
    json_path = os.path.join(os.path.dirname(__file__), 'static', 'buyers_data.json')
    try:
        with open(json_path, 'w') as f:
            json.dump(buyers_data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving buyers data to JSON: {e}")
        return False


def load_sellers_data_from_json():
    """Fallback: Load sellers data from JSON file"""
    json_path = os.path.join(os.path.dirname(__file__), 'static', 'sellers_data.json')
    try:
        with open(json_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "sellers": [],
            "products": [],
            "orders": []
        }
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in {json_path}")
        return {
            "sellers": [],
            "products": [],
            "orders": []
        }


def save_sellers_data_to_json(sellers_data):
    """Fallback: Save sellers data to JSON file"""
    json_path = os.path.join(os.path.dirname(__file__), 'static', 'sellers_data.json')
    try:
        with open(json_path, 'w') as f:
            json.dump(sellers_data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving sellers data to JSON: {e}")
        return False


# ==================== MIGRATION UTILITIES ====================

def migrate_json_to_firebase():
    """Migrate existing JSON data to Firebase"""
    try:
        initialize_firebase()
        
        print("Starting migration from JSON to Firebase...")
        
        # Migrate buyers data
        buyers_data = load_buyers_data_from_json()
        if buyers_data.get('buyers'):
            save_buyers_data(buyers_data)
            print(f"✓ Migrated {len(buyers_data['buyers'])} buyers")
        
        # Migrate sellers data
        sellers_data = load_sellers_data_from_json()
        if sellers_data:
            save_sellers_data(sellers_data)
            print(f"✓ Migrated {len(sellers_data.get('sellers', []))} sellers")
            print(f"✓ Migrated {len(sellers_data.get('products', []))} products")
            print(f"✓ Migrated {len(sellers_data.get('orders', []))} orders")
        
        print("Migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"Error during migration: {e}")
        return False


if __name__ == "__main__":
    # Test Firebase connection and optionally migrate data
    print("Testing Firebase connection...")
    initialize_firebase()
    
    # Uncomment to migrate existing JSON data to Firebase
    # migrate_json_to_firebase()
