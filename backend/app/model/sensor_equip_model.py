from sqlalchemy import Column, Integer, String, Date, ForeignKey
from app.db.database import Base

class SensorEquip(Base):
    __tablename__ = "tb_sensor_equip"

    se_idx = Column(Integer, primary_key=True, autoincrement=True, nullable=False, comment="센서장비 식별번호")
    eb_idx = Column(Integer, ForeignKey("tb_edge_board.eb_idx"), nullable=False, comment="엣지보드 식별번호")
    se_name = Column(String(50), nullable=False, comment="센서이름")
    se_type = Column(String(20), nullable=False, comment="센서타입")
    install_date = Column(Date, nullable=False, comment="설치날짜")
