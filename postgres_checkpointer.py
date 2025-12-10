"""
PostgreSQL Checkpointer for LangGraph Agent Memory
Uses Google Cloud SQL for PostgreSQL to persist conversation state
"""
import os
from langgraph.checkpoint.postgres import PostgresSaver

# Default connection string (will be overridden by environment variable)
DEFAULT_DB_URI = "postgresql://langgraph_user:your_secure_password@localhost:5432/langgraph"

def get_postgres_checkpointer():
    """
    Create and return a PostgreSQL checkpointer for LangGraph.
    
    Connection string format:
    postgresql://username:password@host:port/database
    
    For Google Cloud SQL:
    - Public IP: postgresql://langgraph_user:password@34.71.XX.XX:5432/langgraph
    - Private IP: postgresql://langgraph_user:password@10.123.0.2/langgraph?sslmode=disable
    
    Environment variable: LANGGRAPH_DB_URI
    
    Returns:
        PostgresSaver: Configured PostgreSQL checkpointer
    """
    db_uri = os.getenv("LANGGRAPH_DB_URI", DEFAULT_DB_URI)
    
    try:
        # Create PostgresSaver from connection string
        checkpointer = PostgresSaver.from_conn_string(db_uri)
        
        # Initialize database tables if they don't exist
        checkpointer.setup()
        
        print(f"✓ PostgreSQL checkpointer connected successfully")
        return checkpointer
        
    except Exception as e:
        print(f"⚠ Warning: Could not connect to PostgreSQL: {e}")
        print(f"   Falling back to in-memory checkpointer")
        
        # Fallback to in-memory for development
        from langgraph.checkpoint.memory import InMemorySaver
        return InMemorySaver()


def test_connection():
    """Test PostgreSQL connection and display info"""
    db_uri = os.getenv("LANGGRAPH_DB_URI", DEFAULT_DB_URI)
    
    print("\n" + "="*60)
    print("PostgreSQL Checkpointer Connection Test")
    print("="*60)
    print(f"Database URI: {db_uri.split('@')[1] if '@' in db_uri else 'Not configured'}")
    
    try:
        checkpointer = PostgresSaver.from_conn_string(db_uri)
        checkpointer.setup()
        
        print("✓ Connection: SUCCESS")
        print("✓ Tables: Initialized")
        print("\nYour LangGraph agent conversations will now persist!")
        print("="*60 + "\n")
        
        return True
        
    except Exception as e:
        print(f"✗ Connection: FAILED")
        print(f"✗ Error: {e}")
        print("\nPlease check:")
        print("1. Google Cloud SQL instance is running")
        print("2. Your IP is authorized in Cloud SQL")
        print("3. LANGGRAPH_DB_URI environment variable is set correctly")
        print("4. Database user has proper permissions")
        print("="*60 + "\n")
        
        return False


if __name__ == "__main__":
    # Run connection test
    test_connection()
