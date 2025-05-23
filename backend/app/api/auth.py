# backend/app/api/auth.py (초간소화 버전)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer  # OAuth2PasswordRequestForm은 로그인 폼 데이터 받을 때 사용 가능
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt  # JWT 라이브러리

# 스키마와 DB 모델, DB 세션 가져오기 (경로는 실제 프로젝트 구조에 맞게)
from ..db.database import get_db
from ..model.user_model import User  # User SQLAlchemy 모델 (m_pw 필드가 평문 비밀번호를 저장한다고 가정)
from ..schema.user import SignupRequest, SignupResponse, LoginRequest, LoginResponse, UserResponse, TokenData  # Pydantic 스키마

# --- 설정값 (실제로는 config.py 또는 .env에서 관리) ---
SECRET_KEY = "your-very-secret-key-for-jwt-in-development"  # 개발용 임시 키
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 테스트를 위해 시간 약간 늘림
# --- 설정값 끝 ---

router = APIRouter(tags=["Auth"])  # main.py에서 prefix="/api/auth"로 등록 가정
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")  # /api/auth/login


# JWT 토큰 생성 함수 (간소화 버전에서는 security.py 대신 여기에 직접 정의)
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ✅ 1. 회원가입 (평문 비밀번호 저장 - 보안상 매우 취약, 테스트용)
@router.post("/signup", response_model=SignupResponse)
def signup(user_in: SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.m_id == user_in.m_id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 존재하는 ID입니다."
        )

    # User 모델 생성자에 맞게 데이터 전달
    # User 모델의 m_pw 필드가 평문 비밀번호를 받는다고 가정
    new_user_db_data = user_in.model_dump()  # Pydantic V2
    # new_user_db_data = user_in.dict() # Pydantic V1

    new_user_db = User(**new_user_db_data)

    db.add(new_user_db)
    db.commit()
    db.refresh(new_user_db)
    return {
        "status": "ok",
        "user_id": new_user_db.m_id,
        "message": "관리자 계정이 성공적으로 생성되었습니다."
    }


# ✅ 2. 로그인 (평문 비밀번호 비교 - 보안상 매우 취약, 테스트용)
@router.post("/login", response_model=LoginResponse)
def login(form_data: LoginRequest, db: Session = Depends(get_db)):  # form_data는 LoginRequest 스키마 사용
    # DB에서 사용자 조회 (m_id와 평문 m_pw로 직접 비교)
    user = db.query(User).filter(User.m_id == form_data.m_id, User.m_pw == form_data.m_pw).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 역할 결정 로직 (DB에 m_role 컬럼이 없다면, m_id나 m_position 등으로 임시 결정)
    user_role = "user"
    if user.m_id == "admin" or user.m_position == "관리자" or user.m_position == "팀장":  # 예시 조건
        user_role = "admin"

    access_token_data = {"sub": user.m_id, "role": user_role}  # 토큰에 사용자 ID와 역할 포함
    token = create_access_token(data=access_token_data)

    user_info_for_response = {
        "m_id": user.m_id,
        "m_name": user.m_name,
        "com_name": user.com_name,
        "m_position": user.m_position,
        "role": user_role
    }

    return {
        "status": "ok",
        "token": token,
        "token_type": "bearer",
        "user": user_info_for_response
    }


# ✅ 3. 로그아웃 (클라이언트에서 토큰 삭제가 주된 역할)
@router.get("/logout")
def logout():
    return {"status": "logged_out", "message": "로그아웃 되었습니다."}


# 토큰에서 사용자 정보 추출하는 의존성 함수 (간소화)
async def get_current_user_simple(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.m_id == username).first()
    if user is None:
        raise credentials_exception
    return user  # User SQLAlchemy 모델 객체 반환


# ✅ 4. 사용자 정보 조회 (/me)
@router.get("/me", response_model=UserResponse)  # UserResponse 스키마에 role 필드가 정의되어 있어야 함
def read_users_me(current_user: User = Depends(get_current_user_simple)):
    # UserResponse 스키마에 role이 있다면, current_user 객체에서 role을 가져와야 함.
    # 현재 User 모델에는 role이 없으므로, 여기서 다시 역할을 결정하거나,
    # Pydantic 스키마에서 role을 Optional로 만들고, 값이 없을 경우 처리.
    # 또는 토큰 payload의 role을 사용. (get_current_user_simple이 User 객체만 반환하므로 토큰 payload 직접 접근 불가)

    # 로그인 시 결정했던 role을 다시 결정하거나, 토큰의 role을 사용해야 함
    # 여기서는 간단히 current_user의 m_position 등을 기반으로 다시 결정하는 예시
    user_role = "user"
    if current_user.m_id == "admin" or current_user.m_position in ["관리자", "팀장"]:
        user_role = "admin"

    return {  # UserResponse 스키마 필드에 맞춰서 반환
        "m_id": current_user.m_id,
        "m_name": current_user.m_name,
        "m_position": current_user.m_position,
        "com_name": current_user.com_name,
        "role": user_role  # UserResponse 스키마에 role 필드가 있어야 함
    }