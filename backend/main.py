from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from models import ExpenseCreate, ExpenseUpdate, CategoryCreate, CategoryUpdate
from database import get_supabase
from datetime import datetime, date

app = FastAPI(title="SpendWise API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = get_supabase()
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Verify JWT token with Supabase and return user_id"""
    try:
        response = supabase.auth.get_user(credentials.credentials)
        if response.user is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return response.user.id
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


@app.get("/")
def read_root():
    return {"message": "SpendWise API", "status": "running"}


# ==================== EXPENSES ====================


@app.post("/expenses")
async def create_expense(
    expense: ExpenseCreate, user_id: str = Depends(get_current_user)
):
    """Create a new expense"""
    try:
        final_category = expense.category if expense.category else "Uncategorized"

        # Auto-create category if it doesn't exist
        if final_category and final_category != "Uncategorized":
            try:
                # Checking if category exist
                existing = (
                    supabase.table("categories")
                    .select("*")
                    .eq("user_id", user_id)
                    .eq("name", final_category)
                    .execute()
                )

                # Create if doesn't exist
                if not existing.data or len(existing.data) == 0:
                    supabase.table("categories").insert(
                        {"user_id": user_id, "name": final_category}
                    ).execute()
            except Exception as cat_error:
                print(f"Note: Category creation skipped - {cat_error}")

        # Convert date to string properly
        if isinstance(expense.date, str):
            date_str = expense.date
        else:
            date_str = expense.date.isoformat()

        # Insert expense
        data = {
            "user_id": user_id,
            "title": expense.title,
            "amount": float(expense.amount),
            "category": final_category,
            "date": date_str,
        }

        response = supabase.table("expenses").insert(data).execute()

        return {"success": True, "data": response.data[0]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/expenses")
async def get_expenses(
    page: int = 1, limit: int = 20, user_id: str = Depends(get_current_user)
):
    """Get expenses for a user with pagination"""
    try:
        # Validate pagination params
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 20

        # Calculate offset (0-indexed)
        offset = (page - 1) * limit

        # Get total count for user
        count_response = (
            supabase.table("expenses")
            .select("*", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        total = count_response.count if count_response.count else 0
        total_pages = (total + limit - 1) // limit if total > 0 else 0

        # Get paginated data using range
        response = (
            supabase.table("expenses")
            .select("*")
            .eq("user_id", user_id)
            .order("date", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        return {
            "success": True,
            "data": response.data,
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": total_pages,
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/expenses/{expense_id}")
async def update_expense(
    expense_id: str, expense: ExpenseUpdate, user_id: str = Depends(get_current_user)
):
    """Update an expense"""
    try:
        # First verify the expense belongs to the user
        expense_data = (
            supabase.table("expenses").select("user_id").eq("id", expense_id).execute()
        )
        if not expense_data.data or expense_data.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=404, detail="Expense not found")

        update_data = {k: v for k, v in expense.dict().items() if v is not None}

        # Convert date to string if present
        if "date" in update_data:
            if isinstance(update_data["date"], str):
                update_data["date"] = update_data["date"]
            else:
                update_data["date"] = update_data["date"].isoformat()

        # Auto-create category if it doesn't exist and is being changed
        if "category" in update_data and update_data["category"]:
            try:
                # Check if category exists
                existing = (
                    supabase.table("categories")
                    .select("*")
                    .eq("user_id", user_id)
                    .eq("name", update_data["category"])
                    .execute()
                )

                if not existing.data or len(existing.data) == 0:
                    supabase.table("categories").insert(
                        {"user_id": user_id, "name": update_data["category"]}
                    ).execute()
            except Exception as cat_error:
                print(f"Note: Category creation skipped - {cat_error}")

        response = (
            supabase.table("expenses")
            .update(update_data)
            .eq("id", expense_id)
            .execute()
        )

        return {"success": True, "data": response.data[0] if response.data else None}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, user_id: str = Depends(get_current_user)):
    """Delete an expense"""
    try:
        # First verify the expense belongs to the user
        expense_data = (
            supabase.table("expenses").select("user_id").eq("id", expense_id).execute()
        )
        if not expense_data.data or expense_data.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=404, detail="Expense not found")

        response = supabase.table("expenses").delete().eq("id", expense_id).execute()

        return {"success": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CATEGORIES ====================


@app.post("/categories")
async def create_category(
    category: CategoryCreate, user_id: str = Depends(get_current_user)
):
    """Create a new category"""
    try:
        data = {"user_id": user_id, "name": category.name}

        response = supabase.table("categories").insert(data).execute()
        return {"success": True, "data": response.data[0]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/categories")
async def get_categories(user_id: str = Depends(get_current_user)):
    """Get all categories for a user"""
    try:
        response = (
            supabase.table("categories")
            .select("*")
            .eq("user_id", user_id)
            .order("name")
            .execute()
        )

        return {"success": True, "data": response.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/categories/{category_id}")
async def update_category(
    category_id: str, update: CategoryUpdate, user_id: str = Depends(get_current_user)
):
    """Update a category name"""
    try:
        # First verify the category belongs to the user
        cat_data = (
            supabase.table("categories")
            .select("user_id")
            .eq("id", category_id)
            .execute()
        )
        if not cat_data.data or cat_data.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=404, detail="Category not found")

        response = (
            supabase.table("categories")
            .update({"name": update.name})
            .eq("id", category_id)
            .execute()
        )

        return {"success": True, "data": response.data[0] if response.data else None}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    """Delete a category"""
    try:
        response = supabase.table("categories").delete().eq("id", category_id).execute()

        return {"success": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ANALYTICS ====================


@app.get("/analytics/daily")
async def get_daily_analytics(
    months: int = 6, user_id: str = Depends(get_current_user)
):
    """Get daily spending grouped by day of month and month via RPC"""
    try:
        response = supabase.rpc(
            "get_daily_analytics", {"p_user_id": user_id, "p_months": months}
        ).execute()
        if response.data is None:
            return {"success": True, "data": []}
        return {"success": True, "data": response.data}
    except Exception as e:
        print(f"[ERROR] get_daily_analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/mom")
async def get_mom_analytics(months: int = 12, user_id: str = Depends(get_current_user)):
    """Get month-over-month percentage change via RPC"""
    try:
        response = supabase.rpc(
            "get_mom_analytics", {"p_user_id": user_id, "p_months": months}
        ).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/monthly")
async def get_monthly_analytics(
    start_date: str | None = None, user_id: str = Depends(get_current_user)
):
    """Get monthly spending analytics via RPC"""
    try:
        response = supabase.rpc(
            "get_monthly_analytics", {"p_user_id": user_id, "p_start_date": start_date}
        ).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/category")
async def get_category_analytics(
    month: str | None = None, user_id: str = Depends(get_current_user)
):
    """Get spending by category via RPC"""
    try:
        if month is None:
            raise HTTPException(status_code=400, detail="Month parameter is required")

        response = supabase.rpc(
            "get_category_analytics", {"p_user_id": user_id, "p_month": month}
        ).execute()
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analytics/category-all")
async def get_all_time_category_analytics(
    start_date: str | None = None, user_id: str = Depends(get_current_user)
):
    """Get spending by category for ALL time via RPC"""
    try:
        response = supabase.rpc(
            "get_all_time_category_analytics",
            {"p_user_id": user_id, "p_start_date": start_date},
        ).execute()
        if response.data is None:
            return {"success": True, "data": []}
        return {"success": True, "data": response.data}
    except Exception as e:
        print(f"[ERROR] get_all_time_category_analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CSV UPLOAD ====================
# Deprecated logic removed.

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
