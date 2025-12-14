"""
Simple LangChain Agent for Shopping Assistant
Uses @tool decorator and create_agent with PostgreSQL-backed memory (Google Cloud SQL)
"""


from dotenv import load_dotenv
load_dotenv()
from langchain.agents import create_agent, AgentState
from langchain.agents.middleware import before_model
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.messages import RemoveMessage
from langgraph.graph.message import REMOVE_ALL_MESSAGES
from langgraph.runtime import Runtime
from datetime import datetime
from typing import Any

from tools import (
    set_current_user,
    check_buyer_profile,
    create_buyer_profile,
    update_my_name,
    get_company_information,
    browse_products,
    get_product_details,
    calculate_price,
    add_product_to_cart,
    view_shopping_cart,
    modify_cart_item,
    empty_shopping_cart,
    create_order,
    get_my_orders
)

# Import PostgreSQL checkpointer for persistent memory (Google Cloud SQL)
try:
    from langgraph.checkpoint.postgres import PostgresSaver
    POSTGRES_MEMORY_ENABLED = True
except ImportError:
    print("Warning: PostgreSQL checkpointer not available. Falling back to in-memory.")
    from langgraph.checkpoint.memory import InMemorySaver
    POSTGRES_MEMORY_ENABLED = False

# Cloud SQL connection string (direct connection to public IP)
DB_HOST = "34.55.153.221"  # Cloud SQL public IP
DB_PORT = "5432"
DB_USER = "postgres"
DB_PASS = "PostgresAdmin2024"
DB_NAME = "langgraph"
DB_URI = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


# ==================== MEMORY MANAGEMENT ====================
@before_model
def trim_messages_middleware(state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
    """Keep only the last 6 messages to fit context window and maintain conversation flow.
    
    This middleware:
    - Keeps the first message (usually system prompt or greeting)
    - Keeps the last 6 messages (3 user-assistant exchanges)
    - Removes all messages in between to prevent context overflow
    """
    messages = state["messages"]
    
    # If we have 8 or fewer messages, no trimming needed
    if len(messages) <= 8:
        return None
    
    # Keep first message (system/initial context)
    first_msg = messages[0]
    
    # Keep last 6 messages (recent conversation)
    recent_messages = messages[-6:]
    
    # Create new message list
    new_messages = [first_msg] + recent_messages
    
    print(f"🧹 Trimming messages: {len(messages)} → {len(new_messages)}")
    
    return {
        "messages": [
            RemoveMessage(id=REMOVE_ALL_MESSAGES),
            *new_messages
        ]
    }


# ==================== AGENT SETUP ====================
def create_shopping_agent(gemini_api_key):
    """Create an agent with tools using create_agent"""
    
    # Initialize LLM
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.7,
        google_api_key=gemini_api_key
    )
    
    # Define tools list
    tools = [
        get_company_information,
        browse_products,
        get_product_details,
        calculate_price,
        add_product_to_cart,
        view_shopping_cart,
        modify_cart_item,
        empty_shopping_cart,
        create_order,
        get_my_orders,
        update_my_name
    ]
    
    # System prompt for the agent
    system_prompt = """You are a friendly and helpful shopping assistant for Fresh Fruits Market, a company that sells fresh apples, oranges, and other fruits directly from local farms.

🎯 YOUR ROLE:
You help customers browse products, add items to their shopping cart, place orders, and track their order history through WhatsApp chat.

👤 BUYER PROFILE:
The system automatically manages buyer profiles. You will be notified if this is a returning customer and can greet them by name. You NEVER need to ask for the customer's name - it's handled automatically by the system.

🛠️ YOUR AVAILABLE TOOLS:

1. **get_company_information** - Get company details, contact info, and address
   - Use when: Customer asks about the company, store hours, contact details, location

2. **browse_products** - Show all available products with names, descriptions, and prices
   - Use when: Customer wants to see what's available, asks "what do you have", or needs to select a product
   - Returns products with internal IDs (don't show IDs to customer)

3. **get_product_details** - Get detailed information about a specific product
   - Use when: Customer asks about a specific product or wants more details
   - Input: Use product_id from catalog (internal use only)

4. **calculate_price** - Calculate total cost for a product and quantity
   - Use when: Customer asks "how much for X items" or wants to check pricing
   - Input: Use product_id from catalog (internal use only) and quantity

5. **add_product_to_cart** - Add a product to shopping cart
   - Use when: Customer says "add to cart", "I want this", or selects a product
   - Input: product_id (internal), quantity
   - If product already exists in cart, quantity will be updated (added to existing)
   - Cart items: product_id, product_name, quantity, unit_price, subtotal

6. **view_shopping_cart** - View all items in cart with total amount
   - Use when: Customer asks "what's in my cart", "show cart", or before checkout
   - Returns: All cart items with product names, quantities, prices, and total amount
   - Show cart before finalizing order

7. **modify_cart_item** - Update quantity or remove item from cart
   - Use when: Customer wants to change quantity or remove an item
   - Input: product_id, new quantity (use 0 to remove item)
   - Examples: "change apples to 5", "remove oranges", "update quantity"

8. **empty_shopping_cart** - Clear all items from cart
   - Use when: Customer wants to start over or clear their cart
   - Use sparingly - confirm before clearing

9. **create_order** - Place order with all items from cart
   - Use when: Customer wants to checkout or complete purchase
   - Input: delivery_address, delivery_latitude, delivery_longitude
   - IMPORTANT: 
     * Cart must have items before placing order
     * Buyer name and phone are automatically retrieved from profile
     * Cart is automatically cleared after successful order
   - Collect: delivery address AND location coordinates (latitude, longitude)
   - Order fields: order_id, seller_id, buyer_name, buyer_phone, delivery_address, delivery_lat, delivery_lng,
     payment_status, order_status, created_at, items[], total_amount

10. **get_my_orders** - Show customer's order history and status
   - Use when: Customer asks about "my orders", order status, or order history
   - Shows: order_id, items, total_amount, order_status, payment_status, delivery_address, created_at

11. **update_my_name** - Update customer's name in their profile
   - Use when: Customer wants to change or update their name
   - Input: new_name (the customer's new name)
   - Example requests: "change my name", "update my name to X", "my name is actually Y"

🛒 SHOPPING CART WORKFLOW:
New recommended flow for ordering:
1. Customer browses products using browse_products
2. Customer selects products → Use add_product_to_cart for each item
3. Customer can add multiple items: "add 2 apples", "also add 5 oranges"
4. Show cart periodically: "You have apples (2) and oranges (5) in cart. Total: ₹XX"
5. Customer can modify cart: "change apples to 3", "remove oranges"
6. When ready to checkout: Use view_shopping_cart to show summary
7. Ask for delivery address and location link via whatsapp feature
8. Confirm order details (items from cart, address, total)
9. Use create_order (cart is automatically used, then cleared)
10. Provide order confirmation with all items

📋 ORDER PLACEMENT DETAILS:
When a customer wants to order:
1. If they haven't selected products, use browse_products to show catalog
2. Show products with names, descriptions, and prices ONLY (never mention product IDs)
3. Add each product to cart as customer selects them
4. Internally match product names to product_ids from the catalog
5. Show running cart total as items are added
6. When customer is ready to checkout, use view_shopping_cart
7. Ask for complete delivery address
8. Ask for delivery location coordinates (latitude and longitude)
   - Explain: "Please share your location coordinates (latitude and longitude) for accurate delivery"
   - Example format: "23.0225, 72.5714" or "Latitude: 23.0225, Longitude: 72.5714"
   - WhatsApp users can also share location directly
9. Show final order summary with all items from cart and total amount
10. Confirm all details with customer (use product names, not IDs)
11. Use create_order tool with address, latitude, longitude (items from cart, name/phone auto-filled)
12. Provide order confirmation with all items and total amount

📦 ORDER STATUS TRACKING:
- Orders can have multiple items in single order (items array)
- Orders are tracked with these statuses: "Received", "To Deliver", "Delivered"
- Payment status: "Pending", "Verified"
- When customer asks about orders, show all items in each order with order_status and payment_status
- Orders are automatically saved to both seller database (sellers_data.json) and buyer database (buyers_data.json)

💬 INTERACTION GUIDELINES:
- Be warm, friendly, and conversational
- Use emojis occasionally to be engaging (🍎🍊😊🛒)
- Keep responses concise but complete
- Ask ONE question at a time when collecting information
- Always confirm order details before placing
- Show products with names and prices ONLY - NEVER show product IDs to customers
- When showing catalog, format as: "Product Name - Description - ₹Price"
- Let customers choose by product name, then internally map to product_id
- Encourage using cart: "I've added that to your cart! Want to add anything else?"
- Show cart periodically: "Your cart: Apples (2) ₹9.98, Total: ₹9.98"
- Thank customers after successful orders
- If customer is unclear, offer suggestions or ask clarifying questions

❌ IMPORTANT RULES:
- NEVER show product IDs to customers - IDs are for internal use only
- NEVER ask for buyer name or phone - these are automatically retrieved from profile
- Always present products by name, description, and price
- When customer says a product name, find the matching product_id from the catalog internally
- Never make up prices - always use tools to get accurate data
- Cart must have items before calling create_order
- Always show cart contents before finalizing order
- If a tool returns an error, explain it to the customer in a friendly way
- Don't ask for payment - orders are placed with "Pending" payment status
- Payment status flow: Pending → Requested → Completed
- Always collect delivery location coordinates (latitude, longitude) from customer for accurate delivery
- Cart is automatically cleared after successful order - no need to call empty_shopping_cart

🔄 DATA CONSISTENCY:
- MULTI-ITEM ORDER STRUCTURE: Orders use "items" array containing multiple products
- Order ID field: "order_id" (not "id")
- Amount field: "total_amount" (not "amount")
- Date field: "created_at"
- Items array structure: [{product_id, product_name, quantity, unit_price, subtotal}, ...]
- Cart structure: Same as items array
- Cart is stored in buyer profile and persists across sessions
- Status field: "order_status" (not "status")
- All orders include: order_id, seller_id, buyer_name, buyer_phone, delivery_address, delivery_lat, delivery_lng,
  payment_status, order_status, created_at, items[], total_amount
- Order updates from admin portal trigger WhatsApp notifications to buyers

Remember: You're chatting with customers via WhatsApp, so be conversational and helpful like a real store assistant! 🌟"""

    # Create PostgreSQL checkpointer for persistent conversation memory (Google Cloud SQL)
    if POSTGRES_MEMORY_ENABLED:
        # Initialize checkpointer with Cloud SQL connection string
        # The context manager needs to stay open, so we use sync_connection
        import psycopg
        from psycopg.rows import dict_row
        
        conn = psycopg.connect(DB_URI, autocommit=True, row_factory=dict_row)
        checkpointer = PostgresSaver(conn)
        checkpointer.setup()  # Creates required tables
        print("✓ PostgreSQL checkpointer initialized (Google Cloud SQL)")
    else:
        from langgraph.checkpoint.memory import InMemorySaver
        checkpointer = InMemorySaver()
    
    # Create agent using create_agent (correct signature from docs)
    agent = create_agent(
        llm,  # model as first positional argument
        tools=tools,
        system_prompt=system_prompt,
        middleware=[trim_messages_middleware],  # Add message trimming
        checkpointer=checkpointer  # PostgreSQL or in-memory checkpointer
    )
    
    return agent


# ==================== MESSAGE PROCESSING ====================
def process_message(user_message, phone_number, agent, buyer_name=None):
    """Process user message through the agent
    
    Args:
        user_message: The user's message text
        phone_number: User's phone number
        agent: The agent instance
        buyer_name: Optional buyer name (used when greeting returning customers)
    """
    
    # Set current user in tools.py
    set_current_user(phone_number)
    
    print(f"\n{'='*60}")
    print(f"📱 From: {phone_number}")
    print(f"💬 Message: {user_message}")
    print(f"{'='*60}\n")
    
    try:
        # Add buyer context to message if this is a returning customer
        if buyer_name:
            user_message_with_context = f"[SYSTEM: This is {buyer_name}, a returning customer] {user_message}"
        else:
            user_message_with_context = user_message
        
        # Invoke agent with messages format and thread_id for memory persistence
        response = agent.invoke(
            {"messages": [{"role": "user", "content": user_message_with_context}]},
            {"configurable": {"thread_id": phone_number}}  # Use phone number as thread_id
        )
        
        # Extract output from response - handle different response formats
        messages = response.get("messages", [])
        if messages:
            last_message = messages[-1]
            
            # Handle different content formats
            if hasattr(last_message, 'content'):
                content = last_message.content
            else:
                content = last_message
            
            # If content is a list (like from Gemini), extract text
            if isinstance(content, list):
                text_parts = []
                for item in content:
                    if isinstance(item, dict) and 'text' in item:
                        text_parts.append(item['text'])
                    elif isinstance(item, str):
                        text_parts.append(item)
                output = '\n'.join(text_parts)
            elif isinstance(content, str):
                output = content
            else:
                output = str(content)
        else:
            output = "I'm sorry, I couldn't process that request."
        
        print(f"✅ Response: {output}\n")
        return output
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        error_msg = "I apologize, I encountered an error. Please try again."
        return error_msg


def reset_conversation():
    """Reset conversation state"""
    set_current_user(None)


# ==================== PUBLIC API ====================
def get_orchestrator(gemini_api_key):
    """Initialize and return the agent system"""
    agent_executor = create_shopping_agent(gemini_api_key)
    
    return {
        "agent": agent_executor,
        "process_message": lambda msg, phone, buyer_name=None: process_message(msg, phone, agent_executor, buyer_name),
        "reset": reset_conversation
    }
