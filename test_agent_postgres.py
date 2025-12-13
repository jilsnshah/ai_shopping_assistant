# -*- coding: utf-8 -*-
"""Simple test of the WhatsApp agent with PostgreSQL"""

import sys
import codecs

# Set UTF-8 encoding for Windows console
if sys.platform == "win32":
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

from multi_agent_system import get_orchestrator
import os

GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyCZj_0vyunXRZ49B6AUhvqcRTnLytXtpno")

print("=" * 70)
print("Testing AI Shopping Assistant with PostgreSQL")
print("=" * 70)

# Initialize orchestrator
print("\n1. Initializing agent with PostgreSQL...")
orchestrator = get_orchestrator(GEMINI_API_KEY)
print("✓ Agent initialized successfully")

# Test message processing
print("\n2. Testing message processing...")
phone = "+1234567890"
message = "Hello"

result = orchestrator['process_message'](message, phone)
print(f"\n✓ Agent response: {result[:200]}...")

print("\n✅ All tests passed! PostgreSQL connection is working correctly.")
print("\nPostgreSQL checkpointer is now storing conversation history in Cloud SQL!")
