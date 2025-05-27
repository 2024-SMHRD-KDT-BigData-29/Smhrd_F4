from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, Boolean
from ..db.database import Base

class Alert(Base):
    __tablename__ = "tb_alert"
    a_idx = Column(Integer, primary_key=True, index=True, autoincrement=True)
    m_id = Column(String, nullable=False)
    he_idx = Column(Integer, ForeignKey("tb_hvac_equip.he_idx"), nullable=False)
    a_type = Column(String(50), nullable=False)
    a_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
