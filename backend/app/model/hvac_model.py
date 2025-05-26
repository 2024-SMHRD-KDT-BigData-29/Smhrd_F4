# ✅ model/hvac_model.py
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class HvacEquipment(Base):
    __tablename__ = "tb_hvac_equip"

    he_idx = Column(Integer, primary_key=True, index=True, autoincrement=True)
    he_type = Column(String(20), nullable=False)
    he_name = Column(String(50), nullable=False)
    he_power = Column(Boolean, nullable=False, default=False)

    eb_idx = Column(Integer, ForeignKey("tb_edge_board.eb_idx"), nullable=True)  # 연결된 엣지보드
    sd_idx = Column(Integer, ForeignKey("tb_sensor_data.sd_idx"), nullable=True)  # 센서 데이터 연결 가능 (선택)

    # 관계 (필요 시 활성화)
    # edge_board = relationship("EdgeBoard", back_populates="hvac_equipments")
    # control_logs = relationship("ControlLog", back_populates="hvac_equipment")