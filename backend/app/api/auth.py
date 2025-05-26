# backend/app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer

from app.db.database import get_db
from app.model.user_model import User  # User 모델 경로 확인
from app.schema.user import SignupRequest, SignupResponse, LoginRequest, LoginResponse, UserResponse  # 스키마 경로 확인
from app.util.jwt_handler import create_token, decode_token  # JWT 유틸 함수 경로 확인

# --- 라우터 prefix는 main.py에서 관리 ---
router = APIRouter(prefix="/api/auth", tags=["Auth"])

# OAuth2PasswordBearer 설정: tokenUrl은 실제 토큰 발급 엔드포인트의 전체 경로
# main.py에서 prefix="/api/auth"로 설정했다면, 이 경로는 /api/auth/login 이 됩니다.
# auth.py 내의 라우터에는 prefix가 없으므로, tokenUrl은 상대경로 "login"이 됩니다.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# ✅ 1. 회원가입
@router.post("/signup", response_model=SignupResponse)  # 실제 SignupResponse 스키마에 따라 응답 구조 확인 필요
def signup(user_data: SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.m_id == user_data.m_id).first()
    if existing_user:
        # 일관된 에러 처리를 위해 HTTPException 사용 권장
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,  # 또는 status.HTTP_400_BAD_REQUEST
            detail="이미 존재하는 ID입니다."
        )
        # 또는 SignupResponse 스키마가 {"status": "error", "message": "..."} 형태를 지원한다면 아래 유지
        # return {"status": "error", "message": "이미 존재하는 ID입니다."}

    # --- 비밀번호 해싱 로직 제거 ---
    # Pydantic v2+ 사용시 .model_dump(), v1 사용시 .dict()
    # 비밀번호를 평문 그대로 User 객체에 저장합니다. (보안상 매우 위험)
    new_user = User(**user_data.model_dump())

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # SignupResponse 스키마가 아래 구조를 지원해야 함
    return {
        "status": "ok",
        "user_id": new_user.m_id,  # new_user.m_id 가 맞는지 확인 (보통 PK)
        "message": "관리자 계정이 성공적으로 생성되었습니다."
    }


# ✅ 2. 로그인
@router.post("/login", response_model=LoginResponse)
def login(
        credentials: LoginRequest,  # Pydantic 모델로 요청 본문 받기
        db: Session = Depends(get_db)
):
    # --- 비밀번호 평문 비교 (보안상 매우 위험) ---
    db_user = db.query(User).filter(
        User.m_id == credentials.m_id,
        User.m_pw == credentials.m_pw
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 올바르지 않습니다.",
        )

    token_data = {"sub": db_user.m_id, "role": "manager"}
    token = create_token(token_data)

    return {
        "status": "ok",
        "user": {
            "m_id": db_user.m_id,
            "m_name": db_user.m_name,
            "m_position": db_user.m_position,
            "com_name": db_user.com_name,
            "role": "manager"
        },
        "token": token
    }

# ✅ 3. 로그아웃
@router.get("/logout")
def logout():
    return {
        "status": "logged_out",
        "message": "로그아웃이 완료되었습니다. 클라이언트에서 토큰을 삭제해주세요."
    }


# ✅ 4. 사용자 정보 조회
@router.get("/me", response_model=UserResponse)
def get_user_info(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {str(e)}")

    user = db.query(User).filter(User.m_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자 정보를 찾을 수 없습니다.")
    return user