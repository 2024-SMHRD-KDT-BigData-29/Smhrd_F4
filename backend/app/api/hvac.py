# ✅ api/hvac.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime, timezone

from app.db.database import get_db
from app.model.hvac_model import HvacEquipment
from app.model.edge_board_model import EdgeBoard
from app.model.control_model import ControlLog
from app.schema.hvac_schema import HvacResponse, HvacUpdateRequest

router = APIRouter(prefix="/api/hvac", tags=["HVAC"])


@router.get("/", response_model=List[HvacResponse])
async def read_hvac_equipments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    db_hvac_list = db.query(HvacEquipment).order_by(HvacEquipment.he_idx).offset(skip).limit(limit).all()

    response_data = []
    for equip in db_hvac_list:
        location = "N/A"
        if equip.eb_idx:
            board = db.query(EdgeBoard).filter(EdgeBoard.eb_idx == equip.eb_idx).first()
            if board:
                location = board.eb_loc

        last_log = db.query(ControlLog).filter(ControlLog.he_idx == equip.he_idx).order_by(desc(ControlLog.c_date)).first()

        response_data.append(HvacResponse(
            he_idx=equip.he_idx,
            he_type=equip.he_type,
            he_name=equip.he_name,
            he_location=location,
            he_power=equip.he_power,
            last_controlled_at=last_log.c_date if last_log else None,
            eb_idx=equip.eb_idx
        ))

    return response_data


@router.put("/{he_idx}/", response_model=HvacResponse)
async def update_hvac_equipment_status(he_idx: int, hvac_data: HvacUpdateRequest, db: Session = Depends(get_db)):
    equip = db.query(HvacEquipment).filter(HvacEquipment.he_idx == he_idx).first()
    if not equip:
        raise HTTPException(status_code=404, detail="HVAC 장비를 찾을 수 없습니다.")

    update_fields = hvac_data.dict(exclude_unset=True)

    if "eb_idx" in update_fields and update_fields["eb_idx"] is not None:
        board = db.query(EdgeBoard).filter(EdgeBoard.eb_idx == update_fields["eb_idx"]).first()
        if not board:
            raise HTTPException(status_code=400, detail="유효하지 않은 엣지보드 ID입니다.")

    for key, value in update_fields.items():
        setattr(equip, key, value)

    if "he_power" in update_fields:
        db.add(ControlLog(
            he_idx=he_idx,
            c_type="power_toggle",
            c_role="수동",
            c_hvac=equip.he_power,
            c_date=datetime.now(timezone.utc)
        ))

    db.commit()
    db.refresh(equip)

    location = "N/A"
    if equip.eb_idx:
        board = db.query(EdgeBoard).filter(EdgeBoard.eb_idx == equip.eb_idx).first()
        if board:
            location = board.eb_loc

    last_log = db.query(ControlLog).filter(ControlLog.he_idx == equip.he_idx).order_by(desc(ControlLog.c_date)).first()

    return HvacResponse(
        he_idx=equip.he_idx,
        he_type=equip.he_type,
        he_name=equip.he_name,
        he_location=location,
        he_power=equip.he_power,
        last_controlled_at=last_log.c_date if last_log else None,
        eb_idx=equip.eb_idx
    )
