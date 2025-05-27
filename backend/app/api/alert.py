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
    return [
        AlertWithDeviceName(
            a_idx=a.a_idx,
            m_id=a.m_id,
            he_idx=a.he_idx,
            a_type=a.a_type,
            a_date=a.a_date,
            is_read=a.is_read,
            he_name=he_name,
            a_message=generate_alert_message(a.a_type, a.a_date),  # 메시지 생성 함수 사용
        )
        for a, he_name in results
    ]


def generate_alert_message(a_type: str, a_date: datetime):
    if a_type == "온도이상":
        return f"서버실 온도가 설정된 임계치(30°C)를 초과했습니다."
    elif a_type == "습도이상":
        return f"습도가 허용범위(30~60%)를 벗어났습니다."
    elif a_type == "pm10이상":
        return f"PM10 수치가 기준(50㎍/m³)을 초과했습니다."
    elif a_type == "pm2_5이상":
        return f"PM2.5 수치가 기준(35㎍/m³)을 초과했습니다."
    return "이상 상태가 감지되었습니다."
