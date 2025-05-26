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

class HvacUpdateRequest(BaseModel):
    # 프론트엔드에서 payload에 ...hvacEquipment로 모든 필드를 보내므로,
    # 백엔드에서 필요한 필드들을 정의합니다.
    # he_idx는 URL 경로로 받으므로 여기서는 선택사항이거나 제외 가능합니다.
    he_type: str
    he_name: str
    he_power: int = Field(ge=0, le=1) # 0 또는 1
    eb_idx: Optional[int] = None
    # 더 많은 필드를 업데이트하려면 여기에 추가

    class Config:
        orm_mode = True # SQLAlchemy 모델과 상호작용 시 유용