# backend/app/api/control.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.db.database import get_db
from app.model.hvac_model import HvacEquipment
from app.model.control_model import ControlLog
from app.schema.control_schema import HvacControlRequest, ControlResponse, ControlCreate

# from ..core.security import get_current_active_user
# from ..model.user_model import User as UserModel

router = APIRouter()


@router.post("/send", response_model=ControlResponse)
async def send_hvac_control_command(
        control_in: HvacControlRequest,
        db: Session = Depends(get_db)
        # current_user: UserModel = Depends(get_current_active_user)
):
    db_hvac = db.query(HvacEquipment).filter(HvacEquipment.he_idx == control_in.he_idx).first()
    if not db_hvac:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 공조 설비를 찾을 수 없습니다.")

    # 1. tb_hvac_equip 테이블의 he_power 상태 업데이트
    db_hvac.he_power = bool(control_in.c_hvac)  # 0 또는 1을 boolean으로 변환

    # 2. tb_control 테이블에 조작 이력 저장
    new_control_log_data = ControlCreate(
        he_idx=control_in.he_idx,
        c_role=control_in.c_role,
        c_type=control_in.c_type,
        c_hvac=control_in.c_hvac,
        c_date=datetime.now(timezone.utc)
    )
    new_control_log = ControlLog(**new_control_log_data.model_dump())  # Pydantic V2
    # new_control_log = ControlLog(**new_control_log_data.dict()) # Pydantic V1

    db.add(db_hvac)  # 변경된 hvac 상태
    db.add(new_control_log)  # 새 로그
    db.commit()
    db.refresh(db_hvac)
    db.refresh(new_control_log)

    return ControlResponse(
        status="sent",
        controlled_at=new_control_log.c_date
    )