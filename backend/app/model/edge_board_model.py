from sqlalchemy import Column, Integer, String, Date
from app.db.database import Base

class EdgeBoard(Base):
    __tablename__ = "tb_edge_board"

    eb_idx = Column(Integer, primary_key=True, autoincrement=True, nullable=False, comment="엣지보드 식별번호")
    he_idx = Column(Integer, nullable=False, comment="공조장비 식별번호")
    se_idx = Column(Integer, nullable=False, comment="센서장비 식별번호")
    eb_name = Column(String(50), nullable=False, comment="엣지보드 이름")
    m_id = Column(String(20), nullable=False, comment="관리자 아이디")
    eb_loc = Column(String(20), nullable=False, comment="상세위치")
    install_date = Column(Date, nullable=False, comment="설치날짜")
