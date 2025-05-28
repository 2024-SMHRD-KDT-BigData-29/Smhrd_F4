from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, Boolean, Float
from ..db.database import Base

class Alert(Base):
    __tablename__ = "tb_alert"
    a_idx = Column(Integer, primary_key=True)
    a_type = Column(String)
    a_date = Column(DateTime)
    is_read = Column(Boolean)
    he_idx = Column(Integer, ForeignKey("tb_hvac_equip.he_idx"))
    m_id = Column(String(50), ForeignKey("tb_manager.m_id"))

    # ✅ 실제 측정값 저장 필드 추가
    actual_value = Column(Float, nullable=True)