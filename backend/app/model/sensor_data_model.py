# app/model/sensor_data_model.py
from sqlalchemy import Column, Integer, Float, Boolean, DateTime, ForeignKey
from app.db.database import Base
from datetime import datetime

class SensorData(Base):
    __tablename__ = "tb_sensor_data"

    sd_idx = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False, comment="센서 데이터 식별번호")
    se_idx = Column(Integer, ForeignKey("tb_sensor_equip.se_idx"), nullable=False, comment="센서 장비 식별번호")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="데이터 수집 일시")
    temp = Column(Float, nullable=True, comment="감지된 온도")
    humidity = Column(Float, nullable=True, comment="감지된 습도")
    pm10 = Column(Float, nullable=True, comment="감지된 PM10")
    pm25 = Column(Float, nullable=True, comment="감지된 PM2.5")
    outlier = Column(Boolean, nullable=True, comment="이상치 여부")
