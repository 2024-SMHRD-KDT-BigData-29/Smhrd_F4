# app/api/auth.py

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# => backend 경로를 PYTHONPATH에 추가

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.schema.auth_schema import LoginRequest, LoginResponse, SignupRequest, SignupResponse, UserResponse
from app.db.database import get_db
from app.model.user_model import User



router = APIRouter()

@router.post("/login", response_model=LoginResponse)
def login_user(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.m_id == request.m_id).first()
    if not user or user.m_pw != request.m_pw:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")

    return LoginResponse(
        status="ok",
        user={
            "m_id": user.m_id,
            "m_name": user.m_name,
            "m_position": user.m_position,
            "com_name": user.com_name
        }
    )

@router.post("/signup", response_model=SignupResponse)
def signup_user(request: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.m_id == request.m_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 ID입니다.")

    new_user = User(**request.dict())
    db.add(new_user)
    db.commit()

    return SignupResponse(status="ok", message="회원가입이 완료되었습니다.")

@router.get("/me", response_model=UserResponse)
def get_my_info(m_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.m_id == m_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    return UserResponse(
        m_id=user.m_id,
        m_name=user.m_name,
        m_position=user.m_position,
        com_name=user.com_name
    )

print("✅ auth.py import 정상 작동됨!")