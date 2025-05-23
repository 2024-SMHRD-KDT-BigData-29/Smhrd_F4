# backend/app/model/edge_board_model.py
from sqlalchemy import Column, String, Integer, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class EdgeBoard(Base): # DB 테이블명: tb_edge_board
    __tablename__ = "tb_edge_board"

    eb_idx = Column(Integer, primary_key=True, index=True, autoincrement=True) # DB 스키마는 INT, AI
    # API 명세서의 eb_idx가 문자열(FAB1-...)이라면 String 타입으로 하고 autoincrement 제거
    # 또는 eb_serial_num을 별도로 두고 eb_idx를 INT AI로 유지

    m_id = Column(String(20), ForeignKey("tb_manager.m_id")) # 관리자 ID
    he_idx = Column(Integer, ForeignKey("tb_hvac_equip.he_idx"), nullable=True) # 공조장비 식별번호 (nullable일 수 있음)
    se_idx = Column(Integer, ForeignKey("tb_sensor_equip.se_idx"), nullable=True) # 센서장비 식별번호 (nullable일 수 있음)

    eb_name = Column(String(50), nullable=False)
    eb_loc = Column(String(20), nullable=False) # DB 스키마는 VARCHAR(20) NN
    install_date = Column(Date, nullable=False) # DB 스키마는 DATE NN

    # API 명세서에 있던 eb_serial_num 추가 (DB 스키마에도 반영 필요)
    # eb_serial_num = Column(String(50), unique=True, nullable=True)

    # 관계 설정 (필요시)
    # manager = relationship("User") # User 모델 클래스 이름 사용
    # hvac_equipment = relationship("HvacEquipment")
    # sensor_equipment = relationship("SensorDevice")
    # sensor_data = relationship("SensorData", back_populates="edge_board") # 만약 SensorData가 eb_idx를 직접 참조한다면