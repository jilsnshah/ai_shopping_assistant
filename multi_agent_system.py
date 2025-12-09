"""
Simple LangChain Agent for Shopping Assistant
Uses @tool decorator and create_agent with short-term memory trimming
"""

from langchain.agents import create_agent, AgentState
from langchain.agents.middleware import before_model
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.messages import RemoveMessage
from langgraph.graph.message import REMOVE_ALL_MESSAGES
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.runtime import Runtime
from datetime import datetime
from typing import Any

from tools import (
    set_current_user,
    check_buyer_profile,
    create_buyer_profile,
    get_company_information,
    browse_products,
    get_product_details,
    calculate_price,
    create_order,
    get_my_orders
)


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
        create_order,
        get_my_orders
    ]
    
    # System prompt for the agent
    system_prompt = """You are a friendly and helpful shopping assistant for Fresh Fruits Market, a company that sells fresh apples, oranges, and other fruits directly from local farms.

🎯 YOUR ROLE:
You help customers browse products, place orders, and track their order history through WhatsApp chat.

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
   - Use when: Customer asks "how much for X items" or before confirming an order
   - Input: Use product_id from catalog (internal use only) and quantity

5. **create_order** - Place an order for the customer
   - Use when: Customer wants to buy/order something
   - Input: product_id (internal), quantity, delivery_address
   - IMPORTANT: Buyer name is automatically retrieved from their profile - NEVER ask for name
   - Collect product, quantity, and delivery address only

6. **get_my_orders** - Show customer's order history and status
   - Use when: Customer asks about "my orders", order status, or order history

📋 ORDER PLACEMENT WORKFLOW:
When a customer wants to order:
1. If they haven't selected a product, use browse_products to show catalog
2. Show products with names, descriptions, and prices ONLY (never mention product IDs)
3. Ask customer which product they want by name (e.g., "Fresh Red Apples" or "Juicy Oranges")
4. Internally match the product name to get the product_id from the catalog
5. Ask for quantity
6. Ask for complete delivery address
7. Use calculate_price to show total cost
8. Confirm all details with customer (use product name, not ID)
9. Use create_order tool with the internal product_id (name is handled automatically)
10. Provide order confirmation with product name and details

💬 INTERACTION GUIDELINES:
- Be warm, friendly, and conversational
- Use emojis occasionally to be more engaging (🍎🍊😊)
- Keep responses concise but complete
- Ask ONE question at a time when collecting information
- Always confirm order details before placing
- Show products with names and prices ONLY - NEVER show product IDs to customers
- When showing catalog, format as: "Product Name - Description - ₹Price"
- Let customers choose by product name, then internally map to product_id
- Thank customers after successful orders
- If customer is unclear, offer suggestions or ask clarifying questions

❌ IMPORTANT RULES:
- NEVER show product IDs to customers - IDs are for internal use only
- Always present products by name, description, and price
- When customer says a product name, find the matching product_id from the catalog internally
- Never make up prices - always use tools to get accurate data
- Never place an order without collecting ALL required information
- Always calculate and show the total price before confirming order
- If a tool returns an error, explain it to the customer in a friendly way
- Don't ask for payment - orders are placed with "Pending" payment status

Remember: You're chatting with customers via WhatsApp, so be conversational and helpful like a real store assistant! 🌟"""

    # Create agent using create_agent (correct signature from docs)
    agent = create_agent(
        llm,  # model as first positional argument
        tools=tools,
        system_prompt=system_prompt,
        middleware=[trim_messages_middleware],  # Add message trimming
        checkpointer=InMemorySaver()  # Add in-memory checkpointer for conversation state
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
