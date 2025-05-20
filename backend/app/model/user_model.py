from sqlalchemy import Column, String
from app.db.database import Base

class User(Base):
    __tablename__ = "tb_manager"

    m_id = Column(String(20), primary_key=True, index=True)
    m_pw = Column(String(20))
    m_name = Column(String(50))
    m_tel = Column(String(20))
    charge_line = Column(String(10))
    com_name = Column(String(50))
    m_position = Column(String(20))
    start_date = Column(String(30))
