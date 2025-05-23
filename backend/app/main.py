# backend/app/main.py

import sys
import os
print("🔥 실행된 main.py 경로:", os.path.abspath(__file__)) # 디버깅용 print는 필요에 따라 유지/제거

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 모든 api 모듈을 임포트합니다.
# 각 모듈 (auth.py, devices.py 등) 내부에서 APIRouter(tags=["..."])가 올바르게 사용되었는지 확인하세요!
from .api import auth
from .api import dashboard
from .api import devices
from .api import hvac
from .api import control
# from .api import anomaly # 필요하다면 주석 해제

app = FastAPI(title="Worklean API")






app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"], # 프로덕션에서는 실제 허용할 도메인으로 변경
    allow_credentials=True,
    allow_methods=["*"], # GET, POST 등 필요한 메소드만 허용하는 것이 좋음
    allow_headers=["*"], # Content-Type, Authorization 등 필요한 헤더만 허용 권장
)

# 각 라우터를 앱에 포함시킵니다.
# 각 라우터 파일(예: auth.py) 내에서 APIRouter(tags=["Auth"]) 와 같이 tags가 잘 설정되었다면,
# 아래 include_router에서 tags를 다시 명시할 필요는 없습니다. (하지만 명시해도 문제는 없습니다)
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(devices.router, prefix="/api/devices", tags=["Measuring Devices"])
app.include_router(hvac.router, prefix="/api/hvac-equipments", tags=["HVAC Equipments List"])
app.include_router(control.router, prefix="/api/control", tags=["HVAC Control"])
# app.include_router(anomaly.router, prefix="/api/anomaly", tags=["Anomaly"]) # 필요시

@app.get("/")
def root():
    return {"message": "Worklean API 서버 실행 중. API 문서는 /docs 또는 /redoc 에서 확인하세요."}

# Uvicorn을 `python -m uvicorn backend.app.main:app --reload` 방식으로 실행할 경우,
# 아래 if __name__ == "__main__": 블록은 필수는 아닙니다. (Pycharm 등에서 직접 실행 시 유용)
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)