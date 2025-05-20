# backend/app/api/dashboard.py

from fastapi import APIRouter

router = APIRouter()

@router.get("/live")
def get_live_data():
    return {"status": "live"}
