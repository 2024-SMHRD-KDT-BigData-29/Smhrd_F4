# backend/app/schema/control_schema.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class HvacControlRequest(BaseModel):
    he_idx: int
    c_role: str = Field(..., max_length=10) # 예: "manual", "auto"
    c_type: str = Field(..., max_length=20) # 예: "power_toggle", "set_temp"
    c_hvac: int # 예: 0 (OFF), 1 (ON)

class ControlLogBase(BaseModel): # DB 저장을 위한 기본 스키마
    he_idx: int
    c_role: str
    c_type: str
    c_hvac: Optional[int] = None # 조작 값
    c_date: datetime

class ControlCreate(ControlLogBase):
    pass

class ControlResponse(BaseModel):
    status: str
    controlled_at: datetime

    class Config:
        from_attributes = True # Pydantic V2