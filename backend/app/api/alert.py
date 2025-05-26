from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.model.alert_model import Alert
from app.schema.alert_schema import AlertResponse

router = APIRouter(prefix="/api/alert", tags=["Alert"])

# 이상 알림 전체 조회
@router.get("/", response_model=list[AlertResponse])
def get_all_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).order_by(Alert.a_date.desc()).all()
