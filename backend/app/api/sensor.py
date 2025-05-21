# app/api/sensor.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from pydantic import BaseModel
import redis
import json
from datetime import datetime

router = APIRouter(prefix="/api/sensor", tags=["Sensor"])

# Redis 클라이언트 설정 (로컬 기준)
r = redis.Redis(host="localhost", port=6379, db=0)

# 요청 바디 모델
class SensorDataRequest(BaseModel):
    se_idx: int
    temp: float
    humidity: float
    pm10: float
    pm25: float
    outlier: bool

# 응답 모델
class SensorDataResponse(BaseModel):
    status: str
    saved_to: str

@router.post("/data", response_model=SensorDataResponse)
def receive_sensor_data(data: SensorDataRequest, db: Session = Depends(get_db)):
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        redis_key = f"sensor:{data.se_idx}:{timestamp}"
        redis_value = data.dict()

        # Redis 저장
        r.set(redis_key, json.dumps(redis_value))

        return {"status": "ok", "saved_to": "redis"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"센서 데이터 저장 실패: {str(e)}")