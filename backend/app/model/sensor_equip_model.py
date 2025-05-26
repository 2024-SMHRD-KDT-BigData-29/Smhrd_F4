# app/model/sensor_model.py
from sqlalchemy import Column, Integer, String, Date
from app.db.database import Base

class SensorEquip(Base):
    __tablename__ = "tb_sensor_equip"

    se_idx = Column(Integer, primary_key=True, index=True, nullable=False, comment="센서 장비 식별번호")
    eb_idx = Column(Integer, nullable=True, comment="에지보드 번호")  # FK 여부는 필요시 추가
    se_name = Column(String(50), nullable=False, comment="센서 이름")
    se_type = Column(String(50), nullable=True, comment="센서 타입")
    install_date = Column(Date, nullable=True, comment="설치일자")
