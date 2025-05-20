# backend/app/main.py

import sys
import os
print("🔥 실행된 main.py 경로:", os.path.abspath(__file__))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# => SmhrdF4_git/backend 경로를 PYTHONPATH에 강제로 추가

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, dashboard  # 상대경로 아님에 주의!

app = FastAPI(title="Worklean API")



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Swagger API 자동문서 사이트 등록 /docs
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(dashboard.router, prefix="/api/dashboard")

@app.get("/")
def root():
    return {"message": "Worklean API 서버 실행 중"}

# ✅ PyCharm에서 직접 실행 가능하도록 추가
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
