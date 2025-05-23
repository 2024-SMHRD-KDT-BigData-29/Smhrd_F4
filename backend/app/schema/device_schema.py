# backend/app/schema/device_schema.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime  # datetime 추가


# 장치 생성 시 요청 본문 스키마 (이전에 정의한 것 유지 또는 필요시 수정)
class DeviceCreate(BaseModel):
    eb_idx: str = Field(..., max_length=50)
    eb_name: str = Field(..., max_length=50)
    eb_loc: Optional[str] = Field(None, max_length=20)
    eb_serial_num: Optional[str] = None
    install_date: Optional[date] = None
    m_id: Optional[str] = None


# 장치 수정 시 요청 본문 스키마 (이전에 정의한 것 유지 또는 필요시 수정)
class DeviceUpdate(BaseModel):
    eb_name: Optional[str] = Field(None, max_length=50)
    eb_loc: Optional[str] = Field(None, max_length=20)
    # ... (다른 수정 가능한 필드들)


# ⭐ 장치 정보 응답 스키마 (프론트엔드 표시용으로 필드 확정)
class DeviceResponse(BaseModel):
    eb_idx: str
    m_id: Optional[str] = None  # 장치를 등록한 관리자 ID
    eb_name: Optional[str] = None
    eb_loc: Optional[str] = None
    eb_serial_num: Optional[str] = None
    install_date: Optional[date] = None

    # 프론트엔드 테이블 표시에 필요한 추가 정보 (백엔드에서 채워야 함)
    status: Optional[str] = "offline"  # 예: "online" 또는 "offline"
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    temp: Optional[float] = None
    humidity: Optional[float] = None
    lastUpdate: Optional[datetime] = None  # ISO datetime 문자열 또는 datetime 객체

    class Config:
        from_attributes = True  # Pydantic V2 (orm_mode 대신)