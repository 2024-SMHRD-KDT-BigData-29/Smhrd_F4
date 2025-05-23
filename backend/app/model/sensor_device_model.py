# backend/app/model/sensor_device_model.py
from sqlalchemy import Column, String, Integer, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class SensorDevice(Base): # DB 테이블명: tb_sensor_equip (API 명세서엔 없었음)
    __tablename__ = "tb_sensor_equip" # DB 스키마엔 tb_sensor_device 로 되어있을 수 있음, 확인!

    se_idx = Column(Integer, primary_key=True, index=True, autoincrement=True) # 센서장비 식별번호
    eb_idx = Column(Integer, ForeignKey("tb_edge_board.eb_idx")) # 연결된 엣지보드

    se_name = Column(String(50), nullable=False) # 센서 이름
    se_type = Column(String(20), nullable=False) # 센서 타입 (예: "온도", "습도", "PM2.5")
    install_date = Column(Date, nullable=False) # 설치 날짜

    # 관계 설정
    # edge_board = relationship("EdgeBoard", back_populates="sensors")
    # sensor_data = relationship("SensorData", back_populates="sensor_device")