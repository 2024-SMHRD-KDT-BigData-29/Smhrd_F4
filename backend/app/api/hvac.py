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
from ..schema.hvac_schema import HvacResponse

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

# TODO: 공조 설비(HvacEquipment 모델) 자체에 대한 POST, PUT, DELETE 엔드포인트 필요시 추가