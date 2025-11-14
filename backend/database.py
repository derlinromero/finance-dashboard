import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if SUPABASE_URL is None or SUPABASE_KEY is None or SUPABASE_SERVICE_KEY is None:
    raise ValueError("Supabase URL or KEY not found in environment variables!")

# Initialize Supabase client
supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY or SUPABASE_KEY
)

def get_supabase():
    """Return supabase client instance"""
    return supabase