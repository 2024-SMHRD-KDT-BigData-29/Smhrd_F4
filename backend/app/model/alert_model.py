# backend/app/model/alert_model.py
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Alert(Base): # DB 테이블명: tb_alert
    __tablename__ = "tb_alert"

    a_idx = Column(Integer, primary_key=True, index=True, autoincrement=True)
    m_id = Column(String(20), ForeignKey("tb_manager.m_id"), nullable=True) # 알림을 받은 관리자 (또는 전체 알림)
    he_idx = Column(Integer, ForeignKey("tb_hvac_equip.he_idx"), nullable=True) # 관련된 공조장비
    # 또는 eb_idx = Column(Integer, ForeignKey("tb_edge_board.eb_idx"), nullable=True) # 관련된 엣지보드
    # 또는 se_idx = Column(Integer, ForeignKey("tb_sensor_equip.se_idx"), nullable=True) # 관련된 센서
    # 어떤 장비/센서에서 발생한 알림인지 명확히 하기 위한 FK 설계가 중요합니다.
    # 여기서는 he_idx (공조장비) 또는 다른 장비 ID를 가질 수 있다고 가정합니다.

    a_type = Column(String(50), nullable=False) # 알림 유형 (예: "온도 임계치 초과", "PM2.5 경고")
    a_message = Column(String(255), nullable=True) # 상세 알림 메시지 (DB에 추가 권장)
    a_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False) # 알림 발생 시각
    is_read = Column(Boolean, default=False, nullable=False) # 읽음 여부 (DB에 추가 권장)

    # 관계 설정
    # manager = relationship("User")
    # hvac_equipment = relationship("HvacEquipment")