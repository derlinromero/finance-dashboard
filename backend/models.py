from pydantic import BaseModel, field_validator
from datetime import date, datetime
from typing import Optional, Union

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: Optional[str] = None
    date: Union[date, str]
    user_id: str

    @field_validator('date', mode='before')
    @classmethod
    def parse_date(cls, v):
        if isinstance(v, date):
            return v
        if isinstance(v, str):
            # Try to parse string date
            try:
                return datetime.strptime(v, '%Y-%m-%d').date()
            except ValueError:
                # Try with time component
                try:
                    return datetime.fromisoformat(v.replace('Z', '+00:00')).date()
                except ValueError:
                    raise ValueError('Date must be in YYYY-MM-DD format')
        return v

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str
    user_id: str

class BudgetCreate(BaseModel):
    category: str
    limit_amount: float
    month: date
    user_id: str

class CategorySuggestionRequest(BaseModel):
    title: str
    amount: float
    user_id: str