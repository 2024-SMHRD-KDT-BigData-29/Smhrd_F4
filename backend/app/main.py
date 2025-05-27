# backend/app/main.py

import sys
import os
print("🔥 실행된 main.py 경로:", os.path.abspath(__file__))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# => SmhrdF4_git/backend 경로를 PYTHONPATH에 강제로 추가

from app.db.database import Base, engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, dashboard, sensor, edge_board, hvac, control, alert, power  # 상대경로 아님에 주의!

# SQLAlchemy
from app.model.sensor_equip_model import SensorEquip  # ✅ 이 줄 추가
from app.model.sensor_data_model import SensorData
from app.model.edge_board_model import EdgeBoard
from app.model.power_data_model import PowerData

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Worklean API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Swagger API 자동문서 사이트 등록 /docs
app.include_router(auth.router, tags=["Auth"])
app.include_router(dashboard.router, tags=["Dashboard"])
app.include_router(sensor.router, tags=["Sensor"])
app.include_router(edge_board.router)
app.include_router(hvac.router, tags=["HVAC"])
app.include_router(control.router)
app.include_router(alert.router)
app.include_router(power.router)


@app.get("/")
def root():
    return {"message": "Worklean API 서버 실행 중 + http://127.0.0.1:8000/docs <- api문서 사이트"}

# ✅ PyCharm에서 직접 실행 가능하도록 추가
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

