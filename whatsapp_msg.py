# -*- coding: utf-8 -*-
"""
AI Shopping Assistant Agent with WhatsApp Business API Integration
Handles incoming WhatsApp messages via webhook and sends responses back
"""

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from flask import Flask, request, jsonify
import os
import requests
import json
from datetime import datetime
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_agent
from langchain.tools import tool
from langgraph.checkpoint.memory import InMemorySaver
from typing import Any

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
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCZj_0vyunXRZ49B6AUhvqcRTnLytXtpno")

# Initialize multi-agent orchestrator
orchestrator = None


def get_or_create_orchestrator():
    """Get or create the multi-agent orchestrator"""
    global orchestrator
    if orchestrator is None:
        orchestrator = get_orchestrator(GEMINI_API_KEY)
    return orchestrator


# ==================== NAME COLLECTION AGENT ====================
# Store for confirmed names (phone_number -> name)
name_confirmations = {}

@tool
def confirm_buyer_name(name: str) -> str:
    """Confirm and save the buyer's name after validation.
    Use this tool ONLY when you are certain you have the buyer's correct full name.
    
    Args:
        name: The buyer's full name (first and last name)
    """
    return f"CONFIRMED:{name}"


def create_name_collection_agent():
    """Create an LLM agent specifically for collecting and confirming buyer names"""
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.7,
        google_api_key=GEMINI_API_KEY
    )
    
    system_prompt = """You are a friendly name collection assistant for Fresh Fruits Market.

🎯 YOUR ONLY JOB:
Collect the buyer's full name (first and last name) and confirm it before proceeding.

📋 WORKFLOW:
1. If the user message looks like a greeting (hi, hello, hey): Ask for their full name warmly
2. If the user provides what looks like a name: Confirm it by asking "Just to confirm, your name is [Name]?"
3. If the user confirms (yes, correct, yeah, that's right, yep): Use confirm_buyer_name tool with the name
4. If the user corrects or provides different name: Update the name and confirm again
5. Keep asking until you get a clear full name (first and last name)

✅ WHAT TO DO:
- Be warm and friendly
- Ask for FULL name (first and last)
- Always confirm the name before using the tool
- If user provides only first name, ask for last name
- Use the confirm_buyer_name tool ONLY after explicit confirmation

❌ WHAT NOT TO DO:
- Don't accept single-word names without asking for full name
- Don't confirm without asking the user first
- Don't discuss products or orders (that's not your job)
- Don't use the tool until user explicitly confirms their name

💬 EXAMPLE FLOW:
User: "Hi"
You: "Welcome to Fresh Fruits Market! 🍎 Could you please share your full name?"

User: "John"
You: "Thanks John! Could you also share your last name?"

User: "John Smith"
You: "Great! Just to confirm, your name is John Smith?"

User: "Yes"
You: [Use confirm_buyer_name tool with "John Smith"]

Remember: Be conversational and friendly, but stay focused on getting the full name confirmed!"""
    
    agent = create_agent(
        llm,
        tools=[confirm_buyer_name],
        system_prompt=system_prompt,
        checkpointer=InMemorySaver()
    )
    
    return agent


def collect_buyer_name(phone_number: str, message: str, agent) -> dict:
    """Use LLM agent to collect and confirm buyer name
    
    Returns:
        dict with 'confirmed': bool and 'name': str if confirmed, 'response': str for user
    """
    try:
        response = agent.invoke(
            {"messages": [{"role": "user", "content": message}]},
            {"configurable": {"thread_id": f"name_collection_{phone_number}"}}
        )
        
        # Extract response text
        messages = response.get("messages", [])
        if messages:
            last_message = messages[-1]
            
            if hasattr(last_message, 'content'):
                content = last_message.content
            else:
                content = last_message
            
            # Check if content is a list (Gemini format)
            if isinstance(content, list):
                text_parts = []
                for item in content:
                    if isinstance(item, dict) and 'text' in item:
                        text_parts.append(item['text'])
                    elif isinstance(item, str):
                        text_parts.append(item)
                response_text = '\n'.join(text_parts)
            else:
                response_text = str(content)
            
            # Check if name was confirmed (tool was called)
            if "CONFIRMED:" in response_text:
                confirmed_name = response_text.split("CONFIRMED:")[1].strip()
                print(f"✅ Name confirmed: {confirmed_name}")
                return {
                    "confirmed": True,
                    "name": confirmed_name,
                    "response": f"Thank you, {confirmed_name}! Your profile has been created. ✅"
                }
            else:
                return {
                    "confirmed": False,
                    "response": response_text
                }
        
        return {
            "confirmed": False,
            "response": "Welcome to Fresh Fruits Market! 🍎 Could you please share your full name?"
        }
        
    except Exception as e:
        print(f"❌ Error in name collection: {e}")
        import traceback
        traceback.print_exc()
        return {
            "confirmed": False,
            "response": "Could you please share your full name to continue?"
        }


def send_whatsapp_message(phone_number: str, message: str, seller_id: str = "jilsnshah_at_gmail_dot_com"):
    """Send a message via WhatsApp Business API and save to Firebase"""
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
        
        # Save outgoing message to Firebase
        from firebase_db import save_conversation_message
        save_conversation_message(seller_id, phone_number, "assistant", message)
        
        return response.json()
    except Exception as e:
        print(f"❌ Error sending message: {e}")
        return None


def send_whatsapp_media(phone_number: str, media_file, caption: str = ""):
    """
    Upload and send media (PDF document) via WhatsApp Business API
    
    Args:
        phone_number: Recipient phone number (with country code)
        media_file: File object or file path to upload
        caption: Optional caption text to accompany the media
    
    Returns:
        dict: Response from WhatsApp API or None if failed
    """
    try:
        # Step 1: Upload media to WhatsApp servers
        upload_url = f"{WHATSAPP_API_URL}/{WHATSAPP_PHONE_NUMBER_ID}/media"
        
        headers = {
            "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}"
        }
        
        # Prepare file for upload
        if hasattr(media_file, 'read'):
            # It's a file object
            files = {
                'file': ('invoice.pdf', media_file, 'application/pdf'),
                'messaging_product': (None, 'whatsapp')
            }
        else:
            # It's a file path
            with open(media_file, 'rb') as f:
                files = {
                    'file': ('invoice.pdf', f, 'application/pdf'),
                    'messaging_product': (None, 'whatsapp')
                }
        
        print(f"📤 Uploading media to WhatsApp...")
        upload_response = requests.post(upload_url, headers=headers, files=files)
        upload_response.raise_for_status()
        
        media_id = upload_response.json().get('id')
        print(f"✅ Media uploaded successfully. Media ID: {media_id}")
        
        # Step 2: Send media message with the media_id
        send_url = f"{WHATSAPP_API_URL}/{WHATSAPP_PHONE_NUMBER_ID}/messages"
        
        headers["Content-Type"] = "application/json"
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone_number,
            "type": "document",
            "document": {
                "id": media_id,
                "caption": caption,
                "filename": "invoice.pdf"
            }
        }
        
        print(f"📨 Sending media message to {phone_number}...")
        send_response = requests.post(send_url, headers=headers, json=payload)
        send_response.raise_for_status()
        
        print(f"✅ Media message sent successfully to {phone_number}")
        return send_response.json()
        
    except Exception as e:
        print(f"❌ Error sending media: {e}")
        import traceback
        traceback.print_exc()
        return None


# Name collection agents cache (phone_number -> agent)
name_collection_agents = {}

def process_whatsapp_message(phone_number: str, message_text: str, seller_id: str = "jilsnshah_at_gmail_dot_com"):
    """Process incoming WhatsApp message and generate response using single agent system"""
    try:
        print(f"\n📱 Processing message from {phone_number}: {message_text}")
        
        # Import functions
        from tools import check_buyer_profile, create_buyer_profile
        from firebase_db import save_conversation_message, get_conversation_history
        
        # Check if buyer profile exists
        buyer_profile = check_buyer_profile(phone_number)
        
        if not buyer_profile.get('exists'):
            # New buyer - use name collection agent
            print(f"🆕 New buyer detected: {phone_number}")
            
            # Get or create name collection agent for this phone number
            if phone_number not in name_collection_agents:
                name_collection_agents[phone_number] = create_name_collection_agent()
            
            name_agent = name_collection_agents[phone_number]
            
            # Collect name using LLM agent
            result = collect_buyer_name(phone_number, message_text, name_agent)
            
            if result.get('confirmed'):
                # Name confirmed, create buyer profile
                confirmed_name = result.get('name')
                print(f"✅ Creating profile for: {confirmed_name}")
                
                create_result = create_buyer_profile(phone_number, confirmed_name)
                
                if create_result.get('success'):
                    # Clean up name collection agent
                    if phone_number in name_collection_agents:
                        del name_collection_agents[phone_number]
                    
                    # Save incoming message to Firebase
                    save_conversation_message(seller_id, phone_number, "user", message_text)
                    
                    # Get conversation history
                    history = get_conversation_history(seller_id, phone_number, limit=10)
                    
                    # Get main orchestrator and send welcome message
                    orchestrator = get_or_create_orchestrator()
                    welcome_response = orchestrator["process_message"](
                        "Hi, I'd like to see what products you have", 
                        phone_number,
                        buyer_name=confirmed_name,
                        history=history
                    )
                    
                    return f"Thank you, {confirmed_name}! Your profile has been created. ✅\n\n{welcome_response}"
                else:
                    return "Sorry, I couldn't create your profile. Please try again or contact support."
            else:
                # Still collecting name, return agent's response
                return result.get('response')
        else:
            # Existing buyer - process message normally
            buyer_name = buyer_profile.get('name')
            print(f"👤 Existing buyer: {buyer_name} ({phone_number})")
            
            # Save incoming message to Firebase
            save_conversation_message(seller_id, phone_number, "user", message_text)
            
            # Get conversation history from Firebase
            history = get_conversation_history(seller_id, phone_number, limit=10)
            
            # Get orchestrator instance
            orchestrator = get_or_create_orchestrator()
            
            # Process message through agent with buyer context and history
            agent_response = orchestrator["process_message"](
                message_text, 
                phone_number, 
                buyer_name=buyer_name,
                history=history
            )
            
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
        # Print a summary instead of the full payload
        if data.get("object") == "whatsapp_business_account":
            entries = data.get("entry", [])
            for entry in entries:
                changes = entry.get("changes", [])
                for change in changes:
                    value = change.get("value", {})
                    if "messages" in value:
                        messages = value.get("messages", [])
                        for message in messages:
                            print(f"📥 Incoming message from {message.get('from')}: type={message.get('type')}")
                    elif "statuses" in value:
                        statuses = value.get("statuses", [])
                        for status in statuses:
                            print(f"🔄 Status update: id={status.get('id')}, status={status.get('status')}, recipient={status.get('recipient_id')}")
        
        # Only process incoming user messages (not status updates)
        if data.get("object") == "whatsapp_business_account":
            entries = data.get("entry", [])
            for entry in entries:
                changes = entry.get("changes", [])
                for change in changes:
                    value = change.get("value", {})
                    # Only process if there is a 'messages' key (not 'statuses')
                    if "messages" in value:
                        messages = value.get("messages", [])
                        for message in messages:
                            from_number = message.get("from")
                            message_type = message.get("type")
                            if message_type == "text":
                                message_text = message.get("text", {}).get("body", "")
                                agent_response = process_whatsapp_message(from_number, message_text)
                                send_whatsapp_message(from_number, agent_response)
                            elif message_type == "location":
                                location_data = message.get("location", {})
                                latitude = location_data.get("latitude")
                                longitude = location_data.get("longitude")
                                location_text = f"[location] : latitude: {latitude}, longitude: {longitude}"
                                print(f"📍 Location received from {from_number}: {location_text}")
                                agent_response = process_whatsapp_message(from_number, location_text)
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
