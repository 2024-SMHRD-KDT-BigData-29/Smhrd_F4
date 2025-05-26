# app/api/sensor.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from typing import Optional, Dict
from pydantic import BaseModel
from app.model.sensor_data_model import SensorData
from app.model.alert_model import Alert
from app.model.user_model import User
from app.util.jwt_bearer import JWTBearer
from app.util.jwt_handler import decode_token

import redis
import json
from datetime import datetime

router = APIRouter(prefix="/api/sensor", tags=["Sensor"])

# Redis 클라이언트 설정 (로컬 기준)
r = redis.Redis(host="localhost", port=6379, db=0)

def get_current_user(
    token: str = Depends(JWTBearer()),
    db: Session = Depends(get_db)
) -> User:
    payload = decode_token(token)
    m_id = payload.get("m_id")
    if not m_id:
        raise HTTPException(status_code=401, detail="토큰에 사용자 ID가 없습니다.")

    user = db.query(User).filter(User.m_id == m_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    return user

# 요청 바디 모델
class SensorDataRequest(BaseModel):
    se_idx: int
    temp: Optional[float] = None
    humidity: Optional[float] = None
    pm10: Optional[float] = None
    pm25: Optional[float] = None
    outlier: Optional[bool] = None

# 응답 모델
class SensorDataResponse(BaseModel):
    status: str
    saved_to: str

# 센서데이터 redis 및 mysql 저장
@router.post("/data", response_model=SensorDataResponse)
def receive_sensor_data(data: SensorDataRequest, db: Session = Depends(get_db)):
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        redis_key = f"sensor:{data.se_idx}:{timestamp}"
        redis_value = data.dict()
        r.set(redis_key, json.dumps(redis_value))
        print("[RECEIVED]", data.dict())

        # --- MySQL 저장 시도
        try:
            new_record = SensorData(
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
            print("[MySQL] 저장 성공")
        except Exception as db_error:
            print(f"[MySQL 저장 실패] {db_error}")
            db.rollback()
            raise

        return {"status": "ok", "saved_to": "redis + mysql"}

    except Exception as e:
        print(f"[ERROR] DB 저장 중 예외 발생: {e}")
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
        print(f"[ERROR] DB 저장 중 예외 발생: {e}")  # 로그 출력 추가
        raise HTTPException(status_code=500, detail=f"센서 데이터 저장 실패: {str(e)}")

# ✅ 요청 스키마
class SensorData(BaseModel):
    temp: Optional[float] = None
    humidity: Optional[float] = None
    pm10: Optional[float] = None
    pm25: Optional[float] = None

# ✅ 응답 스키마
class AnomalyCheckResponse(BaseModel):
    is_anomaly: bool
    score: float

class AnomalyCheckRequest(BaseModel):
    sd_idx: str
    data: SensorData

# ✅ 이상치 판별 함수 (비즈니스 로직과 동일)
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


# ✅ 이상 감지 API
@router.post("/anomaly-check", response_model=AnomalyCheckResponse)
def anomaly_check(
    request: AnomalyCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = request.data.dict()
    is_anomaly = check_outlier(
        temp=data.get("temp"),
        humidity=data.get("humidity"),
        pm10=data.get("pm10"),
        pm25=data.get("pm25")
    )

    # ✅ 이상일 경우 항목별로 알림 기록
    if is_anomaly:
        if data.get("temp") is not None and (data["temp"] < 21 or data["temp"] > 26):
            insert_alert(db, current_user.m_id, "온도이상")
        if data.get("humidity") is not None and (data["humidity"] < 35 or data["humidity"] > 60):
            insert_alert(db, current_user.m_id, "습도이상")
        if data.get("pm10") is not None and data["pm10"] > 50:
            insert_alert(db, current_user.m_id, "pm10이상")
        if data.get("pm25") is not None and data["pm25"] > 35:
            insert_alert(db, current_user.m_id, "pm2.5이상")

    return {"is_anomaly": is_anomaly, "score": 0.87}

# 이상치가 탐지됐을 때 tb_alert 자동삽입
def insert_alert(db: Session, m_id: str, a_type: str):
    alert = Alert(
        m_id=m_id,
        he_idx=1,
        a_type=a_type
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

