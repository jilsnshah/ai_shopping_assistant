"""
PostgreSQL Checkpointer for LangGraph Agent Memory
Uses Google Cloud SQL for persistent conversation storage
"""
from langgraph.checkpoint.postgres import PostgresSaver


# Cloud SQL connection details (public IP)
DB_HOST = "34.55.153.221"
DB_PORT = "5432"
DB_USER = "postgres"
DB_PASS = "PostgresAdmin2024"
DB_NAME = "langgraph"

# Build connection string
DB_URI = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


def get_postgres_checkpointer():
    """
    Create PostgreSQL checkpointer for LangGraph.
    Stores conversation memory with phone number as thread_id.
    """
    try:
        # PostgresSaver needs to be created inside a context manager
        # But we can create a regular connection and pass it directly
        from psycopg import Connection
        from psycopg.rows import dict_row
        
        # Create connection with required parameters
        conn = Connection.connect(
            DB_URI,
            autocommit=True,
            row_factory=dict_row
        )
        
        # Create checkpointer with connection
        checkpointer = PostgresSaver(conn)
        checkpointer.setup()
        
        print("✓ PostgreSQL checkpointer ready (Cloud SQL)")
        return checkpointer
        
    except Exception as e:
        print(f"⚠ PostgreSQL failed: {e}")
        print("  Using in-memory storage")
        from langgraph.checkpoint.memory import InMemorySaver
        return InMemorySaver()


if __name__ == "__main__":
    print("Testing PostgreSQL checkpointer...\n")
    checkpointer = get_postgres_checkpointer()
    print("\n✅ Done!")
