# AI Shopping Assistant Agent 🤖🍎🍊

## Overview

This is a LangChain-powered AI agent that helps customers interact with your shopping platform. The agent can provide company information, show product catalogs, answer questions, and help place orders.

## Project Structure

```
├── tools.py                    # Tool functions for the agent
├── agent.py                    # LangChain agent implementation
├── static/sample_data.json     # Data source (loaded by tools)
└── requirements_agent.txt      # Agent dependencies
```

## Files Description

### 1. `tools.py` - Tool Functions
Contains all the utility functions that the agent can use:

**Functions:**
- `get_company_info()` - Returns company name, description, and contact details
- `get_product_catalog()` - Returns all products with ID, title, description, price
- `get_product_by_id(product_id)` - Get specific product details
- `place_order(product_id, quantity, buyer_name, delivery_address)` - Place an order
- `calculate_order_total(product_id, quantity)` - Calculate order total before purchase

### 2. `agent.py` - LangChain Agent
The AI agent implementation using LangChain:

**Features:**
- Uses GPT-3.5-turbo for natural language understanding
- ReAct agent pattern (Reasoning + Acting)
- 5 tools available for the agent to use
- Conversation memory for context-aware responses
- Interactive CLI mode for testing

**Tools Available to Agent:**
1. `GetCompanyInfo` - Get company information
2. `GetProductCatalog` - List all products
3. `GetProductDetails` - Get specific product info
4. `CalculateOrderTotal` - Calculate order cost
5. `PlaceOrder` - Complete the order

## Installation

### Step 1: Install Dependencies

```bash
pip install -r requirements_agent.txt
```

### Step 2: Set OpenAI API Key

**Option A: Environment Variable**
```bash
# Windows PowerShell
$env:OPENAI_API_KEY="your-api-key-here"

# Linux/Mac
export OPENAI_API_KEY="your-api-key-here"
```

**Option B: Enter when prompted**
The agent will ask for your API key when you run it.

## Usage

### Test Tool Functions

Run the tools file directly to test all functions:

```bash
python tools.py
```

This will show:
- Company information
- Product catalog
- Product details
- Order calculation
- Order placement

### Run Interactive Agent

Start a conversation with the AI agent:

```bash
python agent.py
```

This launches an interactive CLI where you can chat with the agent.

### View Available Tools

```bash
python agent.py --test
```

## Example Conversations

### Example 1: Get Company Info
```
You: Tell me about your company
Assistant: We are Fresh Fruits Market! We sell the freshest apples and oranges directly from local farms...
```

### Example 2: Browse Products
```
You: What products do you have?
Assistant: We have 2 products available:
1. Fresh Red Apples - $4.99
2. Juicy Oranges - $3.99
```

### Example 3: Get Product Details
```
You: Tell me more about the apples
Assistant: Our Fresh Red Apples are crispy and sweet, perfect for snacking or baking. They're freshly picked from local orchards and cost $4.99.
```

### Example 4: Calculate Order Total
```
You: How much for 5 apples?
Assistant: For 5 Fresh Red Apples at $4.99 each, your total would be $24.95
```

### Example 5: Place an Order
```
You: I want to order 3 oranges
Assistant: Great! I'll help you place an order for 3 Juicy Oranges. 
         May I have your name?
You: John Smith
Assistant: Thank you, John. What's your delivery address?
You: 456 Oak Street, Springfield
Assistant: Perfect! Your order has been placed successfully!
         Order Details:
         - Product: Juicy Oranges
         - Quantity: 3
         - Total: $11.97
         - Status: Pending Payment
```

## How It Works

### 1. Agent Workflow
```
User Input → LLM Processes → Decides Which Tool → Executes Tool → Returns Response
```

### 2. Tool Selection
The agent intelligently selects tools based on user intent:
- Questions about company → `GetCompanyInfo`
- "What do you sell?" → `GetProductCatalog`
- "Tell me about apples" → `GetProductDetails`
- "How much for X items?" → `CalculateOrderTotal`
- "I want to order" → `PlaceOrder`

### 3. Order Flow
```
1. User expresses interest in ordering
2. Agent asks for product (if not specified)
3. Agent asks for quantity
4. Agent calculates total
5. Agent asks for buyer name
6. Agent asks for delivery address
7. Agent places order using PlaceOrder tool
8. Returns confirmation
```

## Customization

### Modify Agent Behavior

Edit the prompt in `agent.py`:
```python
template = """You are a helpful AI shopping assistant..."""
```

### Add New Tools

1. Add function in `tools.py`
2. Add Tool definition in `agent.py`:
```python
Tool(
    name="YourToolName",
    func=your_function,
    description="Description for the agent"
)
```

### Change LLM Model

In `agent.py`, modify:
```python
llm = ChatOpenAI(
    model="gpt-4",  # Change to gpt-4 or other models
    temperature=0.7
)
```

## Testing Without API Key

You can test the tool functions without an API key:

```bash
python tools.py
```

This will run all tool functions and show their outputs.

## Notes

- The agent uses GPT-3.5-turbo by default (cost-effective)
- Orders are not persisted to the JSON file (in-memory only)
- The agent has conversation memory during a session
- Maximum 5 iterations per request to prevent infinite loops

## Future Enhancements

- [ ] Save orders to the JSON file
- [ ] Add payment processing tool
- [ ] Add order tracking tool
- [ ] Support for multiple languages
- [ ] Integration with web interface
- [ ] Add product search by keywords
- [ ] Support for order cancellation

---

**Ready to chat with your AI assistant? Run `python agent.py` and start ordering! 🚀**
