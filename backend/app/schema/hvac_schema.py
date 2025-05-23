# backend/app/schema/hvac_schema.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class HvacBase(BaseModel):
    he_type: str = Field(..., max_length=20) # DB 스키마 길이 확인
    he_name: str = Field(..., max_length=50) # DB 스키마 길이 확인
    he_location: Optional[str] = None # 이 정보는 eb_idx를 통해 가져오거나, API 응답 시 조합
    he_power: bool # 현재 ON/OFF 상태 (tb_hvac_equip.he_power)

class HvacResponse(HvacBase):
    he_idx: int # 공조장비 식별번호 (tb_hvac_equip.he_idx)
    eb_idx: Optional[int] = None # 연결된 엣지보드 식별번호 (tb_hvac_equip.eb_idx)
    last_controlled_at: Optional[datetime] = None # 최근 조작 시간

    class Config:
        from_attributes = True # Pydantic V2