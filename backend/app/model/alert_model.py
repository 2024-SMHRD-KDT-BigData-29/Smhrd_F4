from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from ..db.database import Base

class Alert(Base):  # 테이블명: tb_alert
    __tablename__ = "tb_alert"

    a_idx = Column(Integer, primary_key=True, index=True, autoincrement=True)
    m_id = Column(String, nullable=False)  # 관리자 아이디
    he_idx = Column(Integer, ForeignKey("tb_hvac_equip.he_idx"), nullable=False)  # 고정: 1
    a_type = Column(String(50), nullable=False)
    a_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
