"""
AI Shopping Assistant Agent with WhatsApp Business API Integration
Handles incoming WhatsApp messages via webhook and sends responses back
"""

from flask import Flask, request, jsonify
import os
import requests
import json
from datetime import datetime

# Import multi-agent system
from multi_agent_system import get_orchestrator

# Initialize Flask app
app = Flask(__name__)

# WhatsApp Business API Configuration
WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL", "https://graph.facebook.com/v18.0")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "930387383485435")
WHATSAPP_BUSINESS_ACCOUNT_ID = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID", "1546131116579021")
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "EAAfpkV7ZALgEBQKgyXWoPUjBAPVJg4xnIG5bE6POZBhv1UtoMVI9ZBxOn17tAOHhIvrQ73vpe4mF3OoYELwWB5ZCFr0FrpHUgIoHB9fy9pnXGVLumkVtol2XGdJUuZA0LAflN6AgXCo3C0yW7OoyaYlx1rHk2BYEYjXrZAGdP9FYTADJR4lMaqkpyCZAdLYkkxLUhLR3NEuwbpW4Iqxo7wAWe1815Hvfam7imxMfRp1uFztU3f1VgwpEnlViu8YG6RFIRWpZBfC7ydN3kv7XEfNafI5oOwZDZD")
VERIFY_TOKEN = os.getenv("VERIFY_TOKEN", "12345")  # Your Meta webhook verify token

# Gemini API Configuration
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyCZj_0vyunXRZ49B6AUhvqcRTnLytXtpno")

# Initialize multi-agent orchestrator
orchestrator = None


def get_or_create_orchestrator():
    """Get or create the multi-agent orchestrator"""
    global orchestrator
    if orchestrator is None:
        orchestrator = get_orchestrator(GEMINI_API_KEY)
    return orchestrator


def send_whatsapp_message(phone_number: str, message: str):
    """Send a message via WhatsApp Business API"""
    url = f"{WHATSAPP_API_URL}/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone_number,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        print(f"✅ Message sent to {phone_number}")
        return response.json()
    except Exception as e:
        print(f"❌ Error sending message: {e}")
        return None


def process_whatsapp_message(phone_number: str, message_text: str):
    """Process incoming WhatsApp message and generate response using single agent system"""
    try:
        print(f"\n📱 Processing message from {phone_number}: {message_text}")
        
        # Get orchestrator instance
        orchestrator = get_or_create_orchestrator()
        
        # Process message through single agent
        agent_response = orchestrator["process_message"](message_text, phone_number)
        
        print(f"🤖 Agent response: {agent_response}\n")
        
        return agent_response
        
    except Exception as e:
        print(f"❌ Error processing message: {e}")
        import traceback
        traceback.print_exc()
        return "Sorry, I encountered an error. Please try again."


# WhatsApp Webhook Endpoints

@app.route('/webhook', methods=['GET'])
def verify_webhook():
    """
    Webhook verification endpoint for WhatsApp Business API
    Facebook/Meta will call this to verify your webhook
    """
    mode = request.args.get('hub.mode')
    token = request.args.get('hub.verify_token')
    challenge = request.args.get('hub.challenge')
    
    if mode == 'subscribe' and token == VERIFY_TOKEN:
        print("✅ Webhook verified successfully!")
        return challenge, 200
    else:
        print("❌ Webhook verification failed!")
        return "Forbidden", 403


@app.route('/webhook', methods=['POST'])
def webhook_callback():
    """
    Webhook callback endpoint for receiving WhatsApp messages
    """
    try:
        data = request.get_json()
        print(f"\n📥 Received webhook data: {json.dumps(data, indent=2)}\n")
        
        # Check if it's a WhatsApp message
        if data.get("object") == "whatsapp_business_account":
            entries = data.get("entry", [])
            
            for entry in entries:
                changes = entry.get("changes", [])
                
                for change in changes:
                    value = change.get("value", {})
                    
                    # Check if there are messages
                    messages = value.get("messages", [])
                    
                    for message in messages:
                        # Get message details
                        from_number = message.get("from")
                        message_type = message.get("type")
                        
                        # Only process text messages
                        if message_type == "text":
                            message_text = message.get("text", {}).get("body", "")
                            
                            # Process the message with the AI agent
                            agent_response = process_whatsapp_message(from_number, message_text)
                            
                            # Send response back via WhatsApp
                            send_whatsapp_message(from_number, agent_response)
        
        return jsonify({"status": "success"}), 200
        
    except Exception as e:
        print(f"❌ Error in webhook callback: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "WhatsApp Shopping Assistant",
        "timestamp": datetime.now().isoformat()
    }), 200


@app.route('/reset', methods=['POST'])
def reset_agent():
    """Reset the agent conversation state"""
    try:
        orchestrator = get_or_create_orchestrator()
        orchestrator["reset"]()
        return jsonify({
            "message": "Agent conversation reset successfully",
            "status": "success"
        }), 200
    except Exception as e:
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500


# Test endpoint to send a message manually
@app.route('/send_test_message', methods=['POST'])
def send_test_message():
    """Test endpoint to send a WhatsApp message manually"""
    data = request.get_json()
    phone_number = data.get('phone_number')
    message = data.get('message')
    
    if not phone_number or not message:
        return jsonify({"error": "phone_number and message are required"}), 400
    
    result = send_whatsapp_message(phone_number, message)
    
    if result:
        return jsonify({"status": "success", "result": result}), 200
    else:
        return jsonify({"status": "error", "message": "Failed to send message"}), 500


if __name__ == '__main__':
    print("=" * 70)
    print("🍎🍊 AI Shopping Assistant - WhatsApp Business API (Single Agent)")
    print("=" * 70)
    print(f"\n✅ Gemini API Key: {'*' * 20}{GEMINI_API_KEY[-10:]}")
    print(f"✅ WhatsApp Phone Number ID: {WHATSAPP_PHONE_NUMBER_ID}")
    print(f"✅ Webhook Verify Token: {VERIFY_TOKEN}")
    print("\n📱 Webhook endpoints:")
    print("   GET  /webhook - Webhook verification")
    print("   POST /webhook - Receive WhatsApp messages")
    print("   GET  /health - Health check")
    print("   POST /reset - Reset agent conversation")
    print("   POST /send_test_message - Send test message")
    print("\n🚀 Starting server...\n")
    
    # Run Flask app
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True
    )
