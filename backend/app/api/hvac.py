# backend/app/api/hvac.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime, timezone

from ..db.database import get_db
from ..model.hvac_model import HvacEquipment
from ..model.edge_board_model import EdgeBoard  # he_location을 위해
from ..model.control_model import ControlLog  # last_controlled_at을 위해
from ..schema.hvac_schema import HvacResponse, HvacUpdateRequest

# from ..core.security import get_current_active_user
# from ..model.user_model import User as UserModel

router = APIRouter()


@router.get("/", response_model=List[HvacResponse])
async def read_hvac_equipments(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
        # current_user: UserModel = Depends(get_current_active_user)
):
    db_hvac_list = db.query(HvacEquipment).order_by(HvacEquipment.he_idx).offset(skip).limit(limit).all()

    response_data = []
    for equip in db_hvac_list:
        location = "N/A"
        # HvacEquipment 모델에 eb_idx가 있고, EdgeBoard와 관계가 설정되어 있다면
        # 또는 equip.eb_idx를 사용하여 직접 EdgeBoard 조회
        if equip.eb_idx:
            edge_board = db.query(EdgeBoard.eb_loc).filter(EdgeBoard.eb_idx == equip.eb_idx).first()
            if edge_board:
                location = edge_board.eb_loc

        last_control_log = db.query(ControlLog.c_date) \
            .filter(ControlLog.he_idx == equip.he_idx) \
            .order_by(desc(ControlLog.c_date)) \
            .first()

        response_data.append(HvacResponse(
            he_idx=equip.he_idx,
            he_type=equip.he_type,
            he_name=equip.he_name,
            he_location=location,
            he_power=equip.he_power,
            last_controlled_at=last_control_log.c_date if last_control_log else None,
            eb_idx=equip.eb_idx
        ))
    return response_data


@router.put("/{he_idx}/", response_model=HvacResponse) # 경로 파라미터로 he_idx 사용, 응답은 HvacResponse
async def update_hvac_equipment_status(
    he_idx: int,
    hvac_data: HvacUpdateRequest, # 요청 본문을 위한 Pydantic 모델
    db: Session = Depends(get_db)
    # current_user: UserModel = Depends(get_current_active_user) # 필요시 주석 해제
):
    db_hvac_equipment = db.query(HvacEquipment).filter(HvacEquipment.he_idx == he_idx).first()

    if not db_hvac_equipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="HVAC Equipment not found")

    # 전달받은 hvac_data에서 he_power 값을 가져와 업데이트
    if hvac_data.he_power is not None: # he_power 값이 명시적으로 전달된 경우에만 업데이트
        db_hvac_equipment.he_power = hvac_data.he_power

        # (선택적) 다른 필드도 업데이트 하려면 여기에 로직 추가
        # if hvac_data.he_name is not None:
        #     db_hvac_equipment.he_name = hvac_data.he_name
        # ...

        # 제어 로그 기록 (예시)
        control_log = ControlLog(
            he_idx=he_idx,
            c_type="power_toggle", # 또는 "set_power" 등
            c_role="수동", # 문자열로 저장
            c_hvac=db_hvac_equipment.he_power,
            c_date=datetime.now(timezone.utc) # UTC 시간으로 기록
        )
        db.add(control_log)

    db.commit()
    db.refresh(db_hvac_equipment)
    location = "N/A"
    if db_hvac_equipment.eb_idx:
        edge_board = db.query(EdgeBoard.eb_loc).filter(EdgeBoard.eb_idx == db_hvac_equipment.eb_idx).first()
        if edge_board:
            location = edge_board.eb_loc

    last_control_log_entry = db.query(ControlLog.c_date) \
        .filter(ControlLog.he_idx == db_hvac_equipment.he_idx) \
        .order_by(desc(ControlLog.c_date)) \
        .first()

    # HvacResponse 모델을 사용하여 응답 객체 생성 및 반환
    return HvacResponse(
        he_idx=db_hvac_equipment.he_idx,
        he_type=db_hvac_equipment.he_type,
        he_name=db_hvac_equipment.he_name,
        he_location=location,
        he_power=db_hvac_equipment.he_power, # 스키마의 he_power 타입(bool)과 DB의 int(0/1) 간 자동변환 주의
        last_controlled_at=last_control_log_entry.c_date if last_control_log_entry else None,
        eb_idx=db_hvac_equipment.eb_idx
    )





