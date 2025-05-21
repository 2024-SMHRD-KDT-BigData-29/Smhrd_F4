# app/schema/sensor.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# ✅ 센서 데이터 수신용 (POST)
class SensorDataRequest(BaseModel):
    se_idx: int = Field(..., description="센서 장비 식별번호")
    temp: float = Field(..., description="감지된 온도")
    humidity: float = Field(..., description="감지된 습도")
    pm10: float = Field(..., description="감지된 미세먼지 PM10")
    pm25: float = Field(..., description="감지된 미세먼지 PM2.5")
    outlier: bool = Field(..., description="이상치 여부")

# ✅ 센서 응답용
class SensorDataResponse(BaseModel):
    status: str
    saved_to: str

# ✅ DB 저장 및 조회용
class SensorData(BaseModel):
    sd_idx: int = Field(..., description="센서 데이터 식별번호 (PK)")
    se_idx: int = Field(..., description="센서 장비 식별번호 (FK)")
    created_at: datetime = Field(..., description="데이터 수집 일시")
    temp: float = Field(..., description="감지된 온도")
    humidity: float = Field(..., description="감지된 습도")
    pm10: float = Field(..., description="감지된 PM10")
    pm25: float = Field(..., description="감지된 PM2.5")
    outlier: bool = Field(..., description="이상치 여부")

    class Config:
        orm_mode = True
