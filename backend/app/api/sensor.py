from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict
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
from app.schema.sensor import HourlyPmResponse, SensorDataResponse

#########################################################
# isolation 연결시 주석풀어야함
#from app.train_model.isolation_fred import predict_outlier
#########################################################

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


# ✅ 이상치 판별 함수// 라즈베리파이 내부 코드
# def check_outlier(temp=None, humidity=None, pm10=None, pm25=None):
#     if temp is not None and (temp < 21 or temp > 26):
#         return True
#     if humidity is not None and (humidity < 35 or humidity > 60):
#         return True
#     if pm25 is not None and pm25 > 35:
#         return True
#     if pm10 is not None and pm10 > 50:
#         return True
#     return False

# ✅ 알림 저장 함수
def insert_alert(db: Session, m_id: str, a_type: str, a_date: datetime, actual_value: Optional[float] = None):
    alert = Alert(
        m_id=m_id,
        he_idx=1,  # 공조장비 ID 고정
        a_type=a_type,
        a_date=a_date,
        is_read=False,
        actual_value=actual_value  # ✅ 여기!
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

# 응답 모델
class SensorDataResponse(BaseModel):
    status: str
    saved_to: str

# ✅ 센서 수집 API (Redis + MySQL 저장)
@router.post("/data", response_model=SensorDataResponse)
def receive_sensor_data(data: SensorDataRequest, db: Session = Depends(get_db)):
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        redis_key = f"sensor:{data.se_idx}:{timestamp}"
        redis_value = data.dict()

        # Redis 저장
        r.set(redis_key, json.dumps(redis_value))
        print(f"[Redis 저장] key={redis_key}, value={redis_value}")

######################################################################
        # # ✅ 온도/습도 이상치 판단
        # if data.temp is not None and data.humidity is not None:
        #     is_outlier = predict_outlier(data.temp, data.humidity)
        #     print("[AI 모델 판별] 이상 감지됨" if is_outlier else "[AI 모델 판별] 정상")
######################################################################


        # MySQL 저장
        try:
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
            print("[MySQL 저장] 성공")
        except Exception as db_error:
            db.rollback()
            print(f"[MySQL 저장 실패] {db_error}")
            raise HTTPException(status_code=500, detail="MySQL 저장 실패")

        # ✅ 여기가 핵심
        return {
            "status": "ok",
            "saved_to": "redis + mysql"
        }

    except Exception as e:
        print(f"[ERROR] 센서 데이터 저장 중 예외 발생: {e}")
        raise HTTPException(status_code=500, detail=f"센서 데이터 저장 실패: {str(e)}")



# ✅ 최신 센서 데이터 조회 + 이상 알림 저장 + API오류 예외처리
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

        latest_data = None
        latest_key = None

        # 최신 키부터 유효한 JSON 파싱 가능할 때까지 역순 탐색
        for key in sorted(keys, reverse=True):
            value = r.get(key)
            if not value:
                continue
            try:
                parsed = json.loads(value)
                latest_data = parsed
                latest_key = key
                break
            except json.JSONDecodeError as e:
                print(f"[ERROR] JSON 파싱 실패 - key: {key}, 이유: {e}")
                continue

        if not latest_data or not latest_key:
            raise HTTPException(status_code=500, detail="유효한 Redis 데이터가 없음")

        # 알림 중복 여부 확인 (Redis에 alert:sent:{key} 저장 여부)
        alert_flag_key = f"alert:sent:{latest_key.decode() if isinstance(latest_key, bytes) else latest_key}"
        if not r.get(alert_flag_key):
            outlier_flag = latest_data.get("outlier", False)

            # None-safe 추출
            temp = latest_data.get("temp")
            humidity = latest_data.get("humidity")
            pm10 = latest_data.get("pm10")
            pm25 = latest_data.get("pm25")

            now = datetime.now()

            # 이상치 조건 만족 시 알림 저장
            if outlier_flag in [True, 1, "1"]:
                if temp is not None and (temp < 21 or temp > 26):
                    insert_alert(db, current_user.m_id, "온도이상", now, actual_value=temp)
                if humidity is not None and (humidity < 35 or humidity > 60):
                    insert_alert(db, current_user.m_id, "습도이상", now, actual_value=humidity)
                if pm10 is not None and pm10 > 50:
                    insert_alert(db, current_user.m_id, "pm10이상", now, actual_value=pm10)
                if pm25 is not None and pm25 > 35:
                    insert_alert(db, current_user.m_id, "pm2_5이상", now, actual_value=pm25)

                # 중복 알림 방지용 Redis 키 기록 (예: 1시간 동안 유지)
                r.setex(alert_flag_key, 3600, "1")

        return {
            "key": latest_key.decode() if isinstance(latest_key, bytes) else latest_key,
            "data": latest_data
        }

    except HTTPException:
        raise
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


