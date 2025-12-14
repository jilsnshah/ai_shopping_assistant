"""
Razorpay Payment Gateway Integration
Handles payment link creation, webhook verification, and payment status updates
"""

import os
import hmac
import hashlib
import razorpay
from firebase_db import get_razorpay_credentials, update_order_payment_link, load_seller_data, save_seller_data


def get_razorpay_client(seller_id):
    """
    Get initialized Razorpay client for a seller
    
    Args:
        seller_id: Seller's ID
        
    Returns:
        tuple: (razorpay.Client, dict) - Client instance and credentials dict
        Returns (None, None) if Razorpay is not enabled or credentials not found
    """
    credentials = get_razorpay_credentials(seller_id)
    
    if not credentials or not credentials.get('enabled'):
        return None, None
    
    api_key = credentials.get('api_key')
    api_secret = credentials.get('api_secret')
    
    if not api_key or not api_secret:
        return None, None
    
    client = razorpay.Client(auth=(api_key, api_secret))
    return client, credentials


def create_payment_link(seller_id, order_id, amount, customer_name, customer_phone, description="Order Payment"):
    """
    Create a Razorpay payment link for an order
    
    Args:
        seller_id: Seller's ID
        order_id: Order ID
        amount: Amount in rupees (will be converted to paise)
        customer_name: Customer's name
        customer_phone: Customer's phone number
        description: Payment description
        
    Returns:
        dict: {'success': bool, 'payment_link': str, 'payment_link_id': str, 'error': str}
    """
    try:
        client, credentials = get_razorpay_client(seller_id)
        
        if not client:
            return {
                'success': False,
                'error': 'Razorpay not enabled or credentials missing'
            }
        
        # Convert amount to paise (Razorpay requires amount in smallest currency unit)
        amount_paise = int(float(amount) * 100)
        
        # Create payment link
        payment_link_data = {
            "amount": amount_paise,
            "currency": "INR",
            "description": description,
            "customer": {
                "name": customer_name,
                "contact": customer_phone
            },
            "notify": {
                "sms": False,  # We'll send our own WhatsApp message
                "email": False
            },
            "reminder_enable": True,
            "notes": {
                "seller_id": str(seller_id),
                "order_id": str(order_id)
            },
            "callback_url": f"https://your-app.com/payment-success",  # Optional success redirect
            "callback_method": "get"
        }
        
        response = client.payment_link.create(payment_link_data)
        
        payment_link_id = response.get('id')
        payment_link_url = response.get('short_url')
        
        # Store payment link ID in order
        update_order_payment_link(seller_id, order_id, payment_link_id)
        
        print(f"✅ Payment link created: {payment_link_url}")
        print(f"   Order ID: {order_id}, Amount: ₹{amount}")
        
        return {
            'success': True,
            'payment_link': payment_link_url,
            'payment_link_id': payment_link_id
        }
        
    except Exception as e:
        print(f"❌ Error creating payment link: {e}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }


def verify_webhook_signature(payload_body, signature, webhook_secret):
    """
    Verify Razorpay webhook signature for security
    
    Args:
        payload_body: Raw webhook payload as bytes or string
        signature: X-Razorpay-Signature header value
        webhook_secret: Webhook secret from Razorpay dashboard
        
    Returns:
        bool: True if signature is valid, False otherwise
    """
    try:
        # Convert payload to bytes if it's a string
        if isinstance(payload_body, str):
            payload_body = payload_body.encode('utf-8')
        
        # Generate expected signature
        expected_signature = hmac.new(
            webhook_secret.encode('utf-8'),
            payload_body,
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures (constant-time comparison to prevent timing attacks)
        return hmac.compare_digest(expected_signature, signature)
        
    except Exception as e:
        print(f"❌ Error verifying webhook signature: {e}")
        return False


def handle_payment_success(payment_link_id, payment_id, seller_id):
    """
    Handle successful payment from webhook
    Updates order payment status to Completed
    
    Args:
        payment_link_id: Razorpay payment link ID
        payment_id: Razorpay payment ID
        seller_id: Seller's ID
        
    Returns:
        dict: {'success': bool, 'order_id': int, 'error': str}
    """
    try:
        # Load seller data to find the order
        seller_data = load_seller_data(seller_id)
        orders = seller_data.get('orders', [])
        
        # Find order with matching payment_link_id
        order_found = None
        order_index = None
        
        for i, order in enumerate(orders):
            if order.get('payment_link_id') == payment_link_id:
                order_found = order
                order_index = i
                break
        
        if not order_found:
            return {
                'success': False,
                'error': f'Order not found for payment link {payment_link_id}'
            }
        
        order_id = order_found.get('order_id')
        
        # Update payment status
        orders[order_index]['payment_status'] = 'Completed'
        orders[order_index]['razorpay_payment_id'] = payment_id
        orders[order_index]['payment_completed_at'] = None  # You can add timestamp if needed
        
        # Save updated data
        seller_data['orders'] = orders
        save_seller_data(seller_id, seller_data)
        
        print(f"✅ Payment completed for Order #{order_id}")
        print(f"   Payment ID: {payment_id}")
        
        # TODO: Send WhatsApp notification to buyer about payment confirmation
        # You can add this later to notify the customer
        
        return {
            'success': True,
            'order_id': order_id
        }
        
    except Exception as e:
        print(f"❌ Error handling payment success: {e}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }


def get_payment_link_status(payment_link_id, seller_id):
    """
    Get the status of a payment link from Razorpay
    
    Args:
        payment_link_id: Razorpay payment link ID
        seller_id: Seller's ID
        
    Returns:
        dict: Payment link details from Razorpay
    """
    try:
        client, credentials = get_razorpay_client(seller_id)
        
        if not client:
            return {
                'success': False,
                'error': 'Razorpay not enabled or credentials missing'
            }
        
        payment_link = client.payment_link.fetch(payment_link_id)
        
        return {
            'success': True,
            'status': payment_link.get('status'),
            'amount': payment_link.get('amount'),
            'amount_paid': payment_link.get('amount_paid'),
            'payments': payment_link.get('payments', [])
        }
        
    except Exception as e:
        print(f"❌ Error fetching payment link status: {e}")
        return {
            'success': False,
            'error': str(e)
        }
