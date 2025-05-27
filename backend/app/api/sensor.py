from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
import redis
import json

from app.db.database import get_db
from typing import List
from app.model.alert_model import Alert
from app.model.user_model import User
from app.model.sensor_data_model import SensorData as SensorDataORM  # ORM용
# User를 직접 만들기 위해 import
from pydantic import BaseModel
from app.schema.sensor import HourlyPmResponse

router = APIRouter(prefix="/api/sensor", tags=["Sensor"])

# Redis 연결
r = redis.Redis(host="localhost", port=6379, db=0)

# --- Schemas ---
# sensor_schema.py 에서 필요한 스키마들을 가져옵니다.
# 아래 SensorDataRequest는 이 파일에 정의된 것을 사용하거나, schema 파일에서 import 합니다.
# 여기서는 schema 파일에서 모두 import 한다고 가정합니다.

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

# ✅ 시간별 PM10/PM2.5 데이터 조회 API
@router.get("/pm/hourly", response_model=List[HourlyPmResponse])
def get_hourly_pm_data(
    se_idx: int = Query(..., description="센서 ID"),
    hours: int = Query(24, description="조회할 시간 범위 (1~48시간)", ge=1, le=48),
    db: Session = Depends(get_db)
):
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)

        results = (
            db.query(
                SensorDataORM.created_at.label("timestamp"),
                SensorDataORM.pm10,
                SensorDataORM.pm25
            )
            .filter(
                SensorDataORM.se_idx == se_idx,
                SensorDataORM.created_at >= start_time,
                SensorDataORM.created_at <= end_time
            )
            .order_by(SensorDataORM.created_at.asc())
            .all()
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PM 데이터 조회 실패: {str(e)}")
