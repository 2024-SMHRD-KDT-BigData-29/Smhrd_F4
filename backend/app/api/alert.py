from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.model.alert_model import Alert
from  typing import List
from app.schema.alert_schema import AlertWithDeviceName
from app.model.hvac_model import HvacEquipment
from datetime import datetime

router = APIRouter(prefix="/api/alert", tags=["Alert"])

# 이상 알림 전체 조회
@router.get("/", response_model=list[AlertWithDeviceName])
def get_all_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).order_by(Alert.a_date.desc()).all()

@router.post("/{a_idx}/read")
def mark_alert_as_read(a_idx: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.a_idx == a_idx).first()
    if not alert:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")

    alert.is_read = True
    db.commit()
    return {"message": "알림 읽음 처리 완료"}

@router.get("/history", response_model=List[AlertWithDeviceName])
def get_alert_history(db: Session = Depends(get_db)):
    results = (
        db.query(Alert, HvacEquipment.he_name)
        .join(HvacEquipment, Alert.he_idx == HvacEquipment.he_idx)
        .order_by(Alert.a_date.desc())
        .limit(50)
        .all()
    )
    return [
        AlertWithDeviceName(
            a_idx=a.a_idx,
            m_id=a.m_id,
            he_idx=a.he_idx,
            a_type=a.a_type,
            a_date=a.a_date,
            is_read=a.is_read,
            he_name=he_name,
            a_message=f"{he_name}에서 {a.a_type} 발생"
        )
        for a, he_name in results
    ]

@router.post("/read-all")
def mark_all_alerts_as_read(db: Session = Depends(get_db)):
    updated_count = db.query(Alert).filter(Alert.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": f"{updated_count}개 알림 읽음 처리됨"}

# backend/app/api/alert.py

@router.get("/anomalies", response_model=List[AlertWithDeviceName])
def get_anomaly_alerts(db: Session = Depends(get_db)):
    results = (
        db.query(Alert, HvacEquipment.he_name)
        .join(HvacEquipment, Alert.he_idx == HvacEquipment.he_idx)
        .order_by(Alert.a_date.desc())
        .all()
    )

    def extract_actual_value(a: Alert) -> float:
        # Alert 모델에 실제 측정값 저장 컬럼이 있다고 가정할 경우 아래처럼 처리
        # 예시: a.temp, a.humidity, a.pm10, a.pm25 가 존재한다고 가정
        return a.actual_value if a.actual_value is not None else 0.0

    return [
        AlertWithDeviceName(
            a_idx=a.a_idx,
            m_id=a.m_id,
            he_idx=a.he_idx,
            a_type=a.a_type,
            a_date=a.a_date,
            is_read=a.is_read,
            he_name=he_name,
            a_message=generate_alert_message(a.a_type, extract_actual_value(a)),
        )
        for a, he_name in results
    ]


def generate_alert_message(a_type: str, actual_value: float) -> str:
    if a_type == "온도이상":
        if actual_value < 21:
            return f"서버실 온도가 하한 임계치(21°C) 미만입니다. 현재 온도: {actual_value:.1f}°C"
        elif actual_value > 26:
            return f"서버실 온도가 상한 임계치(26°C)를 초과했습니다. 현재 온도: {actual_value:.1f}°C"
        else:
            return f"서버실 온도가 임계 범위 내에 있으나 이상 판정됨. 현재 온도: {actual_value:.1f}°C"

    elif a_type == "습도이상":
        if actual_value < 30:
            return f"습도가 하한 임계치(30%) 미만입니다. 현재 습도: {actual_value:.1f}%"
        elif actual_value > 60:
            return f"습도가 상한 임계치(60%)를 초과했습니다. 현재 습도: {actual_value:.1f}%"
        else:
            return f"습도가 임계 범위 내에 있으나 이상 판정됨. 현재 습도: {actual_value:.1f}%"

    elif a_type == "pm10이상":
        return f"PM10 수치가 기준(50㎍/m³)을 초과했습니다. 현재 수치: {actual_value:.1f}㎍/m³"

    elif a_type == "pm2_5이상":
        return f"PM2.5 수치가 기준(35㎍/m³)을 초과했습니다. 현재 수치: {actual_value:.1f}㎍/m³"

    return "이상 상태가 감지되었습니다."