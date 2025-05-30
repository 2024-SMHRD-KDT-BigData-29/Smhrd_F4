# app/model/power_data_model.py (새 파일 또는 적절한 모델 파일에 추가)

from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func  # server_default=func.now() 또는 default=datetime.utcnow 사용 시 필요
from app.db.database import Base  # 실제 Base 객체의 경로로 수정 필요
from datetime import datetime  # default=datetime.utcnow 사용 시 필요


class PowerData(Base):
    __tablename__ = "tb_power_data"

    p_idx = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # 사용자의 확인에 따라 tb_hvac_equip.he_idx를 참조하도록 설정
    he_idx = Column(Integer, ForeignKey("tb_hvac_equip.he_idx"), nullable=False)

    # p_date (측정 시간)는 NOT NULL로 설정하고, 기본값으로 현재 UTC 시간 저장 권장
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # p_power (소비 전력)는 float이고 NOT NULL
    p_power = Column(Float, nullable=False)

    # HvacEquipment 모델과의 관계 설정 (선택 사항, 필요하다면)
    # from .hvac_model import HvacEquipment # HvacEquipment 모델 import
    # hvac_equipment = relationship("HvacEquipment", back_populates="power_logs")
    # (이 경우 HvacEquipment 모델에도 power_logs 관계 정의 필요)