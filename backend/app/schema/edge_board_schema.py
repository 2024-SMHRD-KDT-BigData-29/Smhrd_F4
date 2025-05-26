# backend/app/schema/edge_board_schema.py
from pydantic import BaseModel
from typing import Optional
from datetime import date

# EdgeBoard의 기본 필드를 정의하는 Pydantic 모델
class EdgeBoardBase(BaseModel):
    eb_name: str
    eb_loc: str
    m_id: str  # tb_manager.m_id를 참조하는 외래키
    install_date: date
    he_idx: Optional[int] = None  # tb_hvac_equip.he_idx를 참조 (nullable)
    se_idx: Optional[int] = None  # tb_sensor_equip.se_idx를 참조 (nullable)

# EdgeBoard 생성 시 요청 본문에 사용될 스키마
class EdgeBoardCreate(BaseModel):
    eb_name: str
    eb_loc: str
    m_id: str
    install_date: date
    he_idx: Optional[int] = None
    se_idx: Optional[int] = None

# EdgeBoard 업데이트 시 요청 본문에 사용될 스키마 (모든 필드 선택적)
class EdgeBoardUpdate(BaseModel):
    eb_name: Optional[str] = None
    eb_loc: Optional[str] = None
    m_id: Optional[str] = None
    install_date: Optional[date] = None
    he_idx: Optional[int] = None
    se_idx: Optional[int] = None


# API 응답으로 사용될 스키마 (eb_idx 포함)
class EdgeBoardResponse(EdgeBoardBase):
    eb_idx: int

    class Config:
        orm_mode = True # SQLAlchemy 모델 객체를 Pydantic 모델로 자동 변환 활성화