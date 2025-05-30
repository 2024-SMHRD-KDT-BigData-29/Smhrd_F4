# app/schema/power_schema.py (새 파일 또는 sensor_schema.py 등에 추가)

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List # List는 HourlyPowerConsumptionResponse 응답에 사용

# 전력 데이터 수신(저장)용 스키마 (예: POST /api/power/data 요청 본문)
class PowerDataCreate(BaseModel):
    he_idx: int                 # 전력 데이터를 보내는 장비의 ID (tb_power_data.he_idx에 해당)
    p_power: float              # 측정된 소비 전력 (Watts) (tb_power_data.p_power에 해당)
    created_at: Optional[datetime] = None # 측정 시간 (tb_power_data.p_data에 해당)
                                      # 이 값을 보내지 않으면 서버에서 현재 시간으로 기록합니다.

# (선택적) 단일 전력 데이터 레코드 응답용 스키마 (예: 데이터 저장 후 반환값)
class PowerDataRecordResponse(BaseModel):
    p_idx: int
    he_idx: int
    created_at: datetime # SQLAlchemy 모델의 p_data 컬럼 (타임스탬프)
    p_power: float   # SQLAlchemy 모델의 p_power 컬럼 (전력값)

    class Config:
        from_attributes = True # Pydantic V2 (SQLAlchemy 모델 직접 사용 시)


# 시간별 전력 소비량 API 응답용 스키마 (GET /api/power/hourly_consumption 용)
class HourlyPowerConsumptionResponse(BaseModel):
    timestamp: datetime  # PowerDataORM.p_date 컬럼 값이 여기에 매핑됩니다.
    wattage: Optional[float] = None      # PowerDataORM.p_power 컬럼 값이 여기에 매핑됩니다.
                         # (p_power가 null을 허용한다면 Optional[float] = None)

    class Config:
        from_attributes = True