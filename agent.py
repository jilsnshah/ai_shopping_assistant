"""
AI Shopping Assistant Agent using LangChain
This agent helps users get information about the company, products, and place orders.
"""

from langchain.agents import Tool, AgentExecutor, create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
import os

# Import tool functions
from tools import (
    get_company_info,
    get_product_catalog,
    get_product_by_id,
    place_order,
    calculate_order_total
)


# Define LangChain Tools
tools = [
    Tool(
        name="GetCompanyInfo",
        func=lambda x: get_company_info(),
        description="""Use this tool when the user asks about the company, store, shop, or business information.
        This will provide company name, description, contact details, and address.
        Input: No input needed (just pass empty string)
        """
    ),
    Tool(
        name="GetProductCatalog",
        func=lambda x: get_product_catalog(),
        description="""Use this tool when the user asks what products are available, wants to see the catalog, 
        or asks about what items you sell. This returns all products with their IDs, names, descriptions, and prices.
        Input: No input needed (just pass empty string)
        """
    ),
    Tool(
        name="GetProductDetails",
        func=lambda product_id: get_product_by_id(int(product_id)),
        description="""Use this tool when the user asks about a specific product by name or ID.
        This provides detailed information about a single product.
        Input: Product ID as integer (e.g., "1" or "2")
        """
    ),
    Tool(
        name="CalculateOrderTotal",
        func=lambda input_str: calculate_order_total(*[int(x.strip()) for x in input_str.split(',')]),
        description="""Use this tool to calculate the total cost before placing an order.
        Input: "product_id,quantity" (e.g., "1,3" means product ID 1, quantity 3)
        Returns: unit price, quantity, and total amount
        """
    ),
    Tool(
        name="PlaceOrder",
        func=lambda input_str: place_order_wrapper(input_str),
        description="""Use this tool ONLY when the user explicitly wants to place/confirm an order.
        You MUST collect: product_id, quantity, buyer_name, and delivery_address before using this tool.
        Input format: "product_id|quantity|buyer_name|delivery_address"
        Example: "1|2|John Doe|123 Main St, Springfield"
        Returns: Order confirmation with order details
        """
    )
]


def place_order_wrapper(input_str: str):
    """Wrapper to parse place_order input string"""
    try:
        parts = input_str.split('|')
        if len(parts) != 4:
            return {"error": "Invalid input format. Need: product_id|quantity|buyer_name|delivery_address"}
        
        product_id = int(parts[0].strip())
        quantity = int(parts[1].strip())
        buyer_name = parts[2].strip()
        delivery_address = parts[3].strip()
        
        return place_order(product_id, quantity, buyer_name, delivery_address)
    except Exception as e:
        return {"error": f"Failed to parse input: {str(e)}"}


# Create the agent prompt
template = """You are a helpful AI shopping assistant for a fruit store. Your job is to help customers:
1. Learn about the company
2. Browse products (apples and oranges)
3. Get product details and prices
4. Calculate order totals
5. Place orders

You have access to the following tools:

{tools}

Tool Names: {tool_names}

When helping customers place orders, you MUST collect:
- Product they want (use product catalog to get the ID)
- Quantity they need
- Their name
- Their delivery address

Be friendly, helpful, and guide customers through the ordering process step by step.

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Previous conversation:
{chat_history}

Question: {input}
Thought: {agent_scratchpad}
"""

prompt = PromptTemplate(
    input_variables=["input", "chat_history", "agent_scratchpad", "tools", "tool_names"],
    template=template
)


def create_shopping_agent(gemini_api_key: str = None):
    """
    Create and return a shopping assistant agent.
    
    Args:
        gemini_api_key (str): Google Gemini API key. If None, will try to get from environment.
        
    Returns:
        AgentExecutor: The configured agent
    """
    # Set API key
    if gemini_api_key:
        os.environ["GOOGLE_API_KEY"] = gemini_api_key
    
    # Initialize the LLM with Gemini
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.7,
        google_api_key=gemini_api_key or os.getenv("GOOGLE_API_KEY")
    )
    
    # Create memory
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True
    )
    
    # Create the agent
    agent = create_react_agent(
        llm=llm,
        tools=tools,
        prompt=prompt
    )
    
    # Create agent executor
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        memory=memory,
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=5
    )
    
    return agent_executor


def chat_with_agent(agent_executor, user_input: str):
    """
    Send a message to the agent and get response.
    
    Args:
        agent_executor: The agent executor instance
        user_input (str): User's message
        
    Returns:
        str: Agent's response
    """
    try:
        response = agent_executor.invoke({"input": user_input})
        return response.get("output", "I apologize, I couldn't process that request.")
    except Exception as e:
        return f"Error: {str(e)}"


# Interactive CLI for testing
def run_interactive_chat():
    """Run an interactive chat session with the agent"""
    print("=" * 60)
    print("🍎🍊 AI Shopping Assistant - Interactive Mode")
    print("=" * 60)
    print("\nWelcome! I can help you with:")
    print("- Information about our company")
    print("- Browse our products (apples and oranges)")
    print("- Place orders")
    print("\nType 'exit' or 'quit' to end the conversation.\n")
    
    # Set default Gemini API key
    default_api_key = "AIzaSyCZj_0vyunXRZ49B6AUhvqcRTnLytXtpno"
    
    # Get API key
    api_key = os.getenv("GOOGLE_API_KEY") or default_api_key
    if not api_key:
        api_key = input("Please enter your Google Gemini API key: ").strip()
        if not api_key:
            print("API key required. Exiting.")
            return
    
    # Create agent
    try:
        agent = create_shopping_agent(api_key)
        print("\n✅ Agent initialized successfully!\n")
    except Exception as e:
        print(f"❌ Error initializing agent: {e}")
        return
    
    # Chat loop
    while True:
        try:
            user_input = input("You: ").strip()
            
            if user_input.lower() in ['exit', 'quit', 'bye']:
                print("\nThank you for shopping with us! Goodbye! 👋\n")
                break
            
            if not user_input:
                continue
            
            print("\nAssistant: ", end="")
            response = chat_with_agent(agent, user_input)
            print(response)
            print()
            
        except KeyboardInterrupt:
            print("\n\nGoodbye! 👋\n")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}\n")


if __name__ == "__main__":
    # Test mode - you can run this directly
    print("Starting AI Shopping Assistant...\n")
    
    # Check if we're in test mode or interactive mode
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        # Test mode - show available tools
        print("Available Tools:")
        for i, tool in enumerate(tools, 1):
            print(f"{i}. {tool.name}")
            print(f"   Description: {tool.description}\n")
    else:
        # Interactive mode
        run_interactive_chat()
