from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.model.user_model import User
from app.schema.user import (
    SignupRequest, SignupResponse,
    LoginRequest, LoginResponse,
    UserResponse, UserCreate,
    CurrentUserResponse
)

# 회원가입 로직
def signup(user: SignupRequest, db: Session) -> SignupResponse:
    existing = db.query(User).filter(User.m_id == user.m_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 아이디입니다.")

    new_user = User(
        m_id=user.m_id,
        m_pw=user.m_pw,  # 비밀번호 해싱은 추후 필요
        m_name=user.m_name,
        m_tel=user.m_tel,
        charge_line=user.charge_line,
        com_name=user.com_name,
        m_position=user.m_position,
        start_date=user.start_date
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return SignupResponse(status="success", message="회원가입 완료")

# 로그인 로직
def login(user: LoginRequest, db: Session) -> LoginResponse:
    db_user = db.query(User).filter(User.m_id == user.m_id).first()
    if not db_user or db_user.m_pw != user.m_pw:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")

    user_data = UserResponse(
        m_id=db_user.m_id,
        m_name=db_user.m_name,
        m_position=db_user.m_position,
        com_name=db_user.com_name
    )

    return LoginResponse(
        status="success",
        user=user_data
    )

# 현재 유저 조회 로직
def get_me(user: User) -> CurrentUserResponse:
    return CurrentUserResponse(
        user_id=user.m_id,
        name=user.m_name,
        tel=user.m_tel,
        charge_line=user.charge_line,
        position=user.m_position,
        company=user.com_name,
        start_date=user.start_date,
        role="admin"  # 만약 role 필드가 DB에 없으면 하드코딩 (추후 개선 가능)
    )

