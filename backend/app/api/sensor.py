# app/api/sensor.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.controller.sensor_controller import save_sensor_data_from_redis
from app.model.sensor_data_model import SensorData
from sqlalchemy.orm import Session
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

        # ✅ Redis 저장
        r.set(redis_key, json.dumps(redis_value))

        # ✅ MySQL 저장도 같이 수행
        sensor_data = SensorData(
            se_idx=data.se_idx,
            temp=data.temp,
            humidity=data.humidity,
            pm10=data.pm10,
            pm25=data.pm25,
            outlier=data.outlier,
            created_at=datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        )
        db.add(sensor_data)
        db.commit()

        print("[RECEIVED + SAVED]", data.dict())
        return {"status": "ok", "saved_to": "redis + mysql"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"센서 데이터 저장 실패: {str(e)}")

# api 호출예시
# GET /api/sensor/latest?se_idx=1 
@router.get("/latest", response_model=dict)
def get_latest_sensor_data(se_idx: int):
    try:
        # Redis에서 해당 se_idx로 시작하는 key 목록 조회
        keys = r.keys(f"sensor:{se_idx}:*")
        if not keys:
            raise HTTPException(status_code=404, detail="데이터 없음")

        # 최신 키 찾기
        latest_key = sorted(keys)[-1]  # 시간순으로 정렬 후 마지막
        data = json.loads(r.get(latest_key))
        return {"key": latest_key.decode() if isinstance(latest_key, bytes) else latest_key, "data": data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"조회 실패: {str(e)}")

@router.post("/save_mysql")
def sync_sensor_data(db: Session = Depends(get_db)):
    count = save_sensor_data_from_redis(db)
    return {"status": "ok", "inserted": count}