# ✅ schema/hvac_schema.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class HvacBase(BaseModel):
    he_type: str = Field(..., max_length=20)
    he_name: str = Field(..., max_length=50)
    he_power: bool

class HvacResponse(HvacBase):
    he_idx: int
    eb_idx: Optional[int] = None
    he_location: Optional[str] = None
    last_controlled_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class HvacUpdateRequest(BaseModel):
    he_type: Optional[str] = None
    he_name: Optional[str] = None
    he_power: Optional[bool] = None
    eb_idx: Optional[int] = None

    class Config:
        from_attributes = True
