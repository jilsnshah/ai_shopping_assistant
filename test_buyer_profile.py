"""
Test script for buyer profile management with LLM name collection
"""

from whatsapp_msg import process_whatsapp_message
from tools import check_buyer_profile, load_buyers_data
import json

def test_buyer_flow():
    """Test the complete buyer profile flow with LLM name collection"""
    
    # Test phone number (use a new one not in buyers_data.json)
    test_phone = "9999999999"
    
    print("="*60)
    print("TESTING BUYER PROFILE FLOW WITH LLM NAME COLLECTION")
    print("="*60)
    
    # Test 1: Check if buyer exists (should not exist)
    print("\n📋 Test 1: Check if buyer profile exists")
    profile = check_buyer_profile(test_phone)
    print(f"Result: {profile}")
    
    # Test 2: First message from new buyer (should ask for name)
    print("\n📋 Test 2: New buyer sends greeting")
    print("User: Hi")
    response = process_whatsapp_message(test_phone, "Hi")
    print(f"Bot: {response}")
    
    # Test 3: Buyer provides only first name
    print("\n📋 Test 3: Buyer provides only first name")
    print("User: John")
    response = process_whatsapp_message(test_phone, "John")
    print(f"Bot: {response}")
    
    # Test 4: Buyer provides full name
    print("\n📋 Test 4: Buyer provides full name")
    print("User: John Doe")
    response = process_whatsapp_message(test_phone, "John Doe")
    print(f"Bot: {response}")
    
    # Test 5: User confirms the name
    print("\n📋 Test 5: User confirms name")
    print("User: Yes")
    response = process_whatsapp_message(test_phone, "Yes")
    print(f"Bot: {response}")
    
    # Test 6: Verify profile was created
    print("\n📋 Test 6: Verify profile creation")
    profile = check_buyer_profile(test_phone)
    print(f"Result: {profile}")
    
    # Test 7: Test with existing buyer (from buyers_data.json)
    print("\n📋 Test 7: Existing buyer sends message")
    existing_phone = "7801833884"
    print("User: Show me products")
    response = process_whatsapp_message(existing_phone, "Show me products")
    print(f"Bot: {response}")
    
    # Display current buyers data
    print("\n📋 Current Buyers Data:")
    buyers_data = load_buyers_data()
    print(json.dumps(buyers_data, indent=2))
    
    print("\n" + "="*60)
    print("TESTS COMPLETED")
    print("="*60)

if __name__ == "__main__":
    test_buyer_flow()
