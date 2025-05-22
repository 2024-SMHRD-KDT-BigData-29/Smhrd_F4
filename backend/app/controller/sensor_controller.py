import redis
import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.model.sensor_data_model import SensorData

r = redis.Redis(host="localhost", port=6379, db=0)

def save_sensor_data_from_redis(db: Session):
    keys = r.keys("sensor:*")
    inserted_count = 0

    for key in keys:
        key_str = key.decode()
        se_idx = int(key_str.split(":")[1])
        timestamp = key_str.split(":")[2] + " " + key_str.split(":")[3]
        created_at = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")

        data = json.loads(r.get(key))
        exists = db.query(SensorData).filter_by(se_idx=se_idx, created_at=created_at).first()
        if exists:
            continue  # 이미 저장된 데이터는 스킵

        new_data = SensorData(
            se_idx=se_idx,
            created_at=created_at,
            temp=data.get("temp"),
            humidity=data.get("humidity"),
            pm10=data.get("pm10"),
            pm25=data.get("pm25"),
            outlier=data.get("outlier")
        )

        db.add(new_data)
        inserted_count += 1

    db.commit()
    return inserted_count
