import requests
import re
from typing import Optional
from database import get_supabase

# Common expense patterns for rule-based fallback
EXPENSE_PATTERNS = {
    r'(grocery|supermarket|walmart|target|food|produce)': 'Groceries',
    r'(restaurant|cafe|coffee|starbucks|mcdonald|pizza|burger)': 'Dining Out',
    r'(gas|fuel|shell|exxon|chevron)': 'Transportation',
    r'(uber|lyft|taxi|bus|metro|train)': 'Transportation',
    r'(netflix|spotify|hulu|disney|subscription|prime)': 'Entertainment',
    r'(rent|mortgage|property)': 'Housing',
    r'(electric|water|gas bill|utility)': 'Utilities',
    r'(pharmacy|doctor|hospital|medical|health)': 'Healthcare',
    r'(amazon|ebay|shopping|store|mall)': 'Shopping',
    r'(gym|fitness|sport)': 'Fitness',
    r'(insurance)': 'Insurance',
    r'(phone|internet|mobile|wireless)': 'Bills',
}

def rule_based_categorize(title: str) -> Optional[str]:
    """Simple rule-based categorization using regex patterns"""
    title_lower = title.lower()
    for pattern, category in EXPENSE_PATTERNS.items():
        if re.search(pattern, title_lower):
            return category
    return "Uncategorized"

def get_user_corrections(user_id: str, title: str):
    """Check if user has corrected similar expenses before"""
    supabase = get_supabase()
    
    try:
        # Look for exact or similar title matches in corrections
        response = supabase.table('category_corrections')\
            .select('user_corrected')\
            .eq('user_id', user_id)\
            .ilike('expense_title', f'%{title}%')\
            .order('created_at', desc=True)\
            .limit(1)\
            .execute()
        
        if response.data and isinstance(response.data, list) and len(response.data) > 0:
            first_item = response.data[0]
            if isinstance(first_item, dict) and 'user_corrected' in first_item:
                return first_item['user_corrected']
        return None
    except Exception as e:
        print(f"Error fetching corrections: {e}")
    
    return None

def suggest_category_ai(title: str, amount: float, user_id: str) -> str:
    """
    Suggest category using AI with fallback to rules.
    Priority:
    1. User's past corrections
    2. Hugging Face AI model
    3. Rule-based patterns
    """
    
    # First, check if user has corrected similar expenses
    user_correction = get_user_corrections(user_id, title)
    if user_correction:
        return str(user_correction)
    
    # Try Hugging Face zero-shot classification (FREE)
    try:
        API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
        
        candidate_labels = [
            "Groceries", "Dining Out", "Transportation", "Entertainment",
            "Housing", "Utilities", "Healthcare", "Shopping", "Fitness",
            "Bills", "Insurance", "Travel", "Education", "Personal Care"
        ]
        
        payload = {
            "inputs": title,
            "parameters": {"candidate_labels": candidate_labels}
        }
        
        response = requests.post(API_URL, json=payload, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            # Get the category with highest score
            if 'labels' in result and isinstance(result['labels'], list) and len(result['labels']) > 0:
                first_label = result['labels'][0]
                if isinstance(first_label, str):
                    return first_label
    
    except Exception as e:
        print(f"AI categorization failed: {e}, falling back to rules")
    
    # Fallback to rule-based
    category = rule_based_categorize(title)
    return category or "Uncategorized"

def save_category_correction(user_id: str, title: str, ai_suggested: str, user_corrected: str):
    """Save user's category correction for future learning"""
    supabase = get_supabase()
    
    try:
        supabase.table('category_corrections').insert({
            'user_id': user_id,
            'expense_title': title,
            'ai_suggested': ai_suggested,
            'user_corrected': user_corrected
        }).execute()
    except Exception as e:
        print(f"Error saving correction: {e}")

def detect_anomaly(amount: float, category: str, user_id: str) -> bool:
    """
    Simple anomaly detection: Check if expense is >2x the average for this category
    """
    supabase = get_supabase()
    
    try:
        # Get all expenses in this category for the user
        response = supabase.table('expenses')\
            .select('amount')\
            .eq('user_id', user_id)\
            .eq('category', category)\
            .execute()
        
        if not response.data or len(response.data) < 3:
            # Not enough data to determine anomaly
            return False
        
        amounts = []
        for exp in response.data:
            if isinstance(exp, dict) and 'amount' in exp:
                amt = exp['amount']
                if isinstance(amt, (int, float, str)):
                    try:
                        amounts.append(float(amt))
                    except (TypeError, ValueError):
                        continue
        avg_amount = sum(amounts) / len(amounts)
        
        # Flag as anomaly if more than 2x average
        return amount > (avg_amount * 2)
    
    except Exception as e:
        print(f"Error detecting anomaly: {e}")
        return False