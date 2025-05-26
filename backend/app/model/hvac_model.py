# backend/app/model/hvac_model.py
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from ..db.database import Base

class HvacEquipment(Base): # DB 테이블명: tb_hvac_equip
    __tablename__ = "tb_hvac_equip"

    he_idx = Column(Integer, primary_key=True, index=True, autoincrement=True)
    eb_idx = Column(Integer, ForeignKey("tb_edge_board.eb_idx"), nullable=False) # 연결된 엣지보드
    sd_idx = Column(Integer, ForeignKey("tb_sensor_data.sd_idx"), nullable=True) # 관련 센서 데이터 (선택적일 수 있음)

    he_type = Column(String(20), nullable=False) # DB 스키마 길이 확인 (예: 선풍기, 에어컨)
    he_name = Column(String(50), nullable=False) # DB 스키마 길이 확인
    he_power = Column(Boolean, nullable=False, default=False) # ON/OFF 상태

    # 관계 설정
    # edge_board = relationship("EdgeBoard", back_populates="hvac_equipments")
    # control_logs = relationship("ControlLog", back_populates="hvac_equipment")