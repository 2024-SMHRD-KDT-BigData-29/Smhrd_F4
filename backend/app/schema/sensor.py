# app/schema/sensor.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# ✅ 센서 데이터 수신용 (POST)
class SensorDataRequest(BaseModel):
    se_idx: int = Field(..., description="센서 장비 식별번호")
    temp: Optional[float] = Field(None, description="감지된 온도")       # ✅ 수정
    humidity: Optional[float] = Field(None, description="감지된 습도")   # ✅ 수정
    pm10: Optional[float] = Field(None, description="감지된 미세먼지 PM10") # ✅ 수정
    pm25: Optional[float] = Field(None, description="감지된 미세먼지 PM2.5") # ✅ 수정
    outlier: Optional[bool] = Field(None, description="이상치 여부")       # 선택 사항

# ✅ 센서 응답용
class SensorDataResponse(BaseModel):
    status: str
    saved_to: str

# ✅ DB 저장 및 조회용
class SensorData(BaseModel):
    sd_idx: int = Field(..., description="센서 데이터 식별번호 (PK)")
    se_idx: Optional[int] = Field(..., description="센서 장비 식별번호 (FK)")
    created_at: Optional[datetime] = Field(..., description="데이터 수집 일시")
    temp: Optional[float] = Field(..., description="감지된 온도")
    humidity: Optional[float] = Field(..., description="감지된 습도")
    pm10: Optional[float] = Field(..., description="감지된 PM10")
    pm25: Optional[float] = Field(..., description="감지된 PM2.5")
    outlier: bool = Field(..., description="이상치 여부")

    class Config:
        orm_mode = True

class HourlyPmResponse(BaseModel):
    timestamp: datetime
    pm10: Optional[float] = None
    pm25: Optional[float] = None

    class Config:
        from_attributes = True