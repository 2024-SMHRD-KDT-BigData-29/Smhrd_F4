from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import redis
import json

from app.db.database import get_db
from app.model.alert_model import Alert
from app.model.user_model import User
from app.model.sensor_data_model import SensorData as SensorDataORM  # ORM용
# User를 직접 만들기 위해 import
from pydantic import BaseModel

router = APIRouter(prefix="/api/sensor", tags=["Sensor"])

# Redis 연결
r = redis.Redis(host="localhost", port=6379, db=0)

# ✅ 항상 admin으로 설정된 사용자 반환
def get_current_user() -> User:
    return User(m_id="admin")


# ✅ 이상치 판별 함수
def check_outlier(temp=None, humidity=None, pm10=None, pm25=None):
    if temp is not None and (temp < 21 or temp > 26):
        return True
    if humidity is not None and (humidity < 35 or humidity > 60):
        return True
    if pm25 is not None and pm25 > 35:
        return True
    if pm10 is not None and pm10 > 50:
        return True
    return False


# ✅ 알림 저장 함수
def insert_alert(db: Session, m_id: str, a_type: str, a_date: datetime):
    alert = Alert(
        m_id=m_id,
        he_idx=1,  # 공조장비 ID는 고정 1
        a_type=a_type,
        a_date=a_date
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)


# ✅ 센서 데이터 요청용 모델
class SensorDataRequest(BaseModel):
    se_idx: int
    temp: Optional[float] = None
    humidity: Optional[float] = None
    pm10: Optional[float] = None
    pm25: Optional[float] = None
    outlier: Optional[bool] = None

# ✅ 센서 수집 API (Redis + MySQL 저장)
@router.post("/data")
def receive_sensor_data(data: SensorDataRequest, db: Session = Depends(get_db)):
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        redis_key = f"sensor:{data.se_idx}:{timestamp}"
        redis_value = data.dict()
        r.set(redis_key, json.dumps(redis_value))

        new_record = SensorDataORM(
            se_idx=data.se_idx,
            created_at=datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S"),
            temp=data.temp,
            humidity=data.humidity,
            pm10=data.pm10,
            pm25=data.pm25,
            outlier=data.outlier
        )
        db.add(new_record)
        db.commit()
        return {"status": "ok", "saved_to": "redis + mysql"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"센서 데이터 저장 실패: {str(e)}")


# ✅ 최신 센서 데이터 조회 + 이상 알림 저장
@router.get("/latest")
def get_latest_sensor_data(
    se_idx: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        keys = r.keys(f"sensor:{se_idx}:*")
        if not keys:
            raise HTTPException(status_code=404, detail="데이터 없음")

        latest_key = sorted(keys)[-1]
        raw_data = json.loads(r.get(latest_key))
        outlier_flag = raw_data.get("outlier", False)

        # ✅ 이상치일 경우 알림 저장
        if outlier_flag in [True, 1, "1"]:
            now = datetime.now()
            if raw_data.get("temp") is not None and (raw_data["temp"] < 21 or raw_data["temp"] > 26):
                insert_alert(db, current_user.m_id, "온도이상", now)
            if raw_data.get("humidity") is not None and (raw_data["humidity"] < 35 or raw_data["humidity"] > 60):
                insert_alert(db, current_user.m_id, "습도이상", now)
            if raw_data.get("pm10") is not None and raw_data["pm10"] > 50:
                insert_alert(db, current_user.m_id, "pm10이상", now)
            if raw_data.get("pm25") is not None and raw_data["pm25"] > 35:
                insert_alert(db, current_user.m_id, "pm2.5이상", now)

        return {
            "key": latest_key.decode() if isinstance(latest_key, bytes) else latest_key,
            "data": raw_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"센서 데이터 조회 실패: {str(e)}")
