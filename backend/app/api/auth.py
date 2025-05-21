from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from app.db.database import get_db
from app.model.user_model import User
from app.schema.user import SignupRequest, SignupResponse, LoginRequest, LoginResponse, UserResponse
from app.util.jwt_handler import create_token, decode_token  # JWT 유틸 함수
from app.util.jwt_bearer import JWTBearer  # JWT 인증 의존성

router = APIRouter( tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ✅ 1. 회원가입
@router.post("/signup", response_model=SignupResponse)
def signup(user: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.m_id == user.m_id).first()
    if existing:
        return {"status": "error", "message": "이미 존재하는 ID입니다."}

    new_user = User(**user.dict())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "status": "ok",
        "user_id": new_user.m_id,
        "message": "관리자 계정이 성공적으로 생성되었습니다."
    }


# ✅ 2. 로그인
@router.post("/login", response_model=LoginResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.m_id == credentials.m_id, User.m_pw == credentials.m_pw).first()
    if not user:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")

    token = create_token(user)  # JWT 토큰 생성
    return {
        "status": "ok",
        "user": {
            "m_id": user.m_id,
            "m_name": user.m_name,
            "m_position": user.m_position,
            "com_name": user.com_name,
            "role": "manager"  # 정적 값 or DB에서 받아올 수 있음
        },
        "token": token
    }


# ✅ 3. 로그아웃
@router.get("/logout")
def logout():
    return {
        "status": "logged_out",
        "message": "로그아웃이 완료되었습니다."
    }


# ✅ 4. 사용자 정보 조회
@router.get("/me", response_model=UserResponse)
def get_user_info(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    user = db.query(User).filter(User.m_id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자 정보를 찾을 수 없습니다.")
    return user
