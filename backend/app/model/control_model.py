# backend/app/model/control_model.py
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class ControlLog(Base):  # DB 테이블명: tb_control
    __tablename__ = "tb_control"

    c_idx = Column(Integer, primary_key=True, index=True, autoincrement=True)
    he_idx = Column(Integer, ForeignKey("tb_hvac_equip.he_idx"), nullable=False)  # 제어된 공조장비

    c_role = Column(String(10), nullable=False)  # 수동, 자동
    c_type = Column(String(20), nullable=False)  # 제어 타입 (예: cooling, fan_on, power_off)
    c_hvac = Column(Integer, nullable=True)  # HVAC 조작 값 (API 명세는 INT, 예: 0 또는 1)
    c_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)  # 제어 시각

    # 관계 설정
    # hvac_equipment = relationship("HvacEquipment", back_populates="control_logs")