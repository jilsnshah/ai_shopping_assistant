"""
WhatsApp Embedded Signup Handler

This module handles the WhatsApp Embedded Signup flow for connecting
seller WhatsApp Business accounts to the platform.
"""

import os
import requests
import secrets

# Facebook App Configuration
FB_APP_ID = os.getenv('FB_APP_ID', '2227135407795713')
FB_APP_SECRET = os.getenv('FB_APP_SECRET', '')
GRAPH_API_VERSION = 'v21.0'
GRAPH_API_BASE = f'https://graph.facebook.com/{GRAPH_API_VERSION}'


def exchange_code_for_token(code: str) -> dict:
    """
    Exchange the authorization code for an access token.
    
    Args:
        code: Authorization code from FB.login callback
        
    Returns:
        dict with 'access_token' and 'token_type' or None if failed
    """
    try:
        url = f'{GRAPH_API_BASE}/oauth/access_token'
        params = {
            'client_id': FB_APP_ID,
            'client_secret': FB_APP_SECRET,
            'code': code
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"❌ Error exchanging code for token: {e}")
        return None


def get_whatsapp_business_accounts(access_token: str) -> list:
    """
    Get all WhatsApp Business Accounts associated with the access token.
    
    Args:
        access_token: User's access token from Embedded Signup
        
    Returns:
        List of WABA objects with id, name, and phone_numbers
    """
    try:
        # First, get debug info to find the business ID
        url = f'{GRAPH_API_BASE}/debug_token'
        params = {
            'input_token': access_token,
            'access_token': f'{FB_APP_ID}|{FB_APP_SECRET}'
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        debug_data = response.json().get('data', {})
        
        # Get the granted WABAs from the token
        granular_scopes = debug_data.get('granular_scopes', [])
        waba_ids = []
        
        for scope in granular_scopes:
            if scope.get('scope') == 'whatsapp_business_management':
                waba_ids = scope.get('target_ids', [])
                break
        
        # Fetch details for each WABA
        accounts = []
        for waba_id in waba_ids:
            waba_url = f'{GRAPH_API_BASE}/{waba_id}'
            waba_params = {
                'access_token': access_token,
                'fields': 'id,name,phone_numbers{id,verified_name,code_verification_status,display_phone_number}'
            }
            
            waba_response = requests.get(waba_url, params=waba_params)
            waba_response.raise_for_status()
            waba_data = waba_response.json()
            accounts.append(waba_data)
        
        return accounts
    except Exception as e:
        print(f"❌ Error getting WhatsApp Business Accounts: {e}")
        return []


def get_phone_number_details(access_token: str, phone_number_id: str) -> dict:
    """
    Get details for a specific phone number.
    
    Args:
        access_token: User's access token
        phone_number_id: WhatsApp Phone Number ID
        
    Returns:
        Phone number details including display_phone_number, verified_name
    """
    try:
        url = f'{GRAPH_API_BASE}/{phone_number_id}'
        params = {
            'access_token': access_token,
            'fields': 'id,verified_name,code_verification_status,display_phone_number,quality_rating'
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"❌ Error getting phone number details: {e}")
        return None


def subscribe_app_to_waba(access_token: str, waba_id: str) -> bool:
    """
    Subscribe the app to receive webhook notifications for a WABA.
    
    Args:
        access_token: User's access token
        waba_id: WhatsApp Business Account ID
        
    Returns:
        True if subscription successful, False otherwise
    """
    try:
        url = f'{GRAPH_API_BASE}/{waba_id}/subscribed_apps'
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(url, headers=headers)
        response.raise_for_status()
        result = response.json()
        
        return result.get('success', False)
    except Exception as e:
        print(f"❌ Error subscribing app to WABA: {e}")
        return False


def register_phone_number(access_token: str, phone_number_id: str) -> bool:
    """
    Register a phone number for messaging.
    
    Args:
        access_token: User's access token
        phone_number_id: WhatsApp Phone Number ID
        
    Returns:
        True if registration successful, False otherwise
    """
    try:
        url = f'{GRAPH_API_BASE}/{phone_number_id}/register'
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        payload = {
            'messaging_product': 'whatsapp',
            'pin': '123456'  # 6-digit PIN for 2FA (will need to be configurable)
        }
        
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        
        return result.get('success', False)
    except Exception as e:
        print(f"❌ Error registering phone number: {e}")
        return False


def generate_verify_token() -> str:
    """
    Generate a secure random verify token for webhook verification.
    
    Returns:
        Random 32-character hexadecimal string
    """
    return secrets.token_hex(16)


def process_embedded_signup(access_token: str) -> dict:
    """
    Process the complete Embedded Signup flow.
    
    This function:
    1. Gets all WABAs associated with the token
    2. Extracts the first phone number (or lets user choose)
    3. Subscribes the app to receive webhooks
    4. Returns credentials ready for storage
    
    Args:
        access_token: Access token from FB.login callback
        
    Returns:
        dict with:
        - success: bool
        - phone_number_id: str
        - business_account_id: str
        - access_token: str
        - verify_token: str
        - phone_display: str (for UI display)
        - business_name: str
    """
    result = {
        'success': False,
        'error': None
    }
    
    try:
        # Get WhatsApp Business Accounts
        accounts = get_whatsapp_business_accounts(access_token)
        
        if not accounts:
            result['error'] = 'No WhatsApp Business Accounts found. Please complete the signup process.'
            return result
        
        # Use the first account (in production, might want to let user choose)
        waba = accounts[0]
        waba_id = waba.get('id')
        waba_name = waba.get('name', 'Unknown Business')
        
        # Get phone numbers
        phone_numbers = waba.get('phone_numbers', {}).get('data', [])
        
        if not phone_numbers:
            result['error'] = 'No phone numbers found in your WhatsApp Business Account.'
            return result
        
        # Use the first phone number
        phone = phone_numbers[0]
        phone_number_id = phone.get('id')
        phone_display = phone.get('display_phone_number', '')
        verified_name = phone.get('verified_name', waba_name)
        
        # Subscribe app to WABA for webhooks
        subscribe_app_to_waba(access_token, waba_id)
        
        # Generate verify token for webhook
        verify_token = generate_verify_token()
        
        result.update({
            'success': True,
            'phone_number_id': phone_number_id,
            'business_account_id': waba_id,
            'access_token': access_token,
            'verify_token': verify_token,
            'phone_display': phone_display,
            'business_name': verified_name
        })
        
        print(f"✅ Embedded Signup processed successfully for {verified_name} ({phone_display})")
        return result
        
    except Exception as e:
        print(f"❌ Error processing Embedded Signup: {e}")
        result['error'] = str(e)
        return result
