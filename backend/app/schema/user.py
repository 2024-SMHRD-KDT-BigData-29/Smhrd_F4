from pydantic import BaseModel, Field
from typing import Optional


# ✅ 회원가입용
class SignupRequest(BaseModel):
    m_id: str
    m_pw: str
    m_name: str
    m_tel: str
    charge_line: str
    com_name: str
    m_position: str
    start_date: str


class SignupResponse(BaseModel):
    status: str
    message: str


# ✅ 로그인용
class LoginRequest(BaseModel):
    m_id: str
    m_pw: str


class LoginResponse(BaseModel):
    status: str
    user: Optional["UserResponse"]  # 실제 사용자 정보 포함
    token: str  # ⭐ API 명세서에는 token도 있었으므로 추가
    token_type: str = "bearer"  # ⭐ token_type 추가 (표준)


# ✅ 유저 정보 응답용 (및 로그인 응답 내 user 객체용으로도 사용 가능)
class UserResponse(BaseModel):
    m_id: str
    m_name: str
    m_position: Optional[str] = None # DB에서 NULL 가능하면 Optional 사용
    com_name: Optional[str] = None   # DB에서 NULL 가능하면 Optional 사용
    role: str                      # ⭐ role 필드 추가!

    class Config:
        # orm_mode = True # Pydantic V1
        from_attributes = True # Pydantic V2 권장 (로그에 경고 뜸)


# ✅ DB 생성용 (SQLAlchemy 모델 매핑)
class UserCreate(BaseModel):
    m_id: str = Field(..., max_length=20)
    m_pw: str = Field(..., max_length=20)
    m_name: str = Field(..., max_length=50)
    m_tel: str = Field(..., max_length=20)
    charge_line: str = Field(..., max_length=10)
    com_name: str = Field(..., max_length=50)
    m_position: str = Field(..., max_length=20)
    start_date: str = Field(..., max_length=30)


# ✅ 수정용
class UserUpdate(BaseModel):
    m_name: Optional[str] = Field(None, max_length=50)
    m_tel: Optional[str] = Field(None, max_length=20)
    charge_line: Optional[str] = Field(None, max_length=10)
    com_name: Optional[str] = Field(None, max_length=50)
    m_position: Optional[str] = Field(None, max_length=20)
    start_date: Optional[str] = Field(None, max_length=30)

    class Config:
        from_attributes = True

# 사용자 조회 응답
class CurrentUserResponse(BaseModel):
    user_id: str
    name: str
    tel: str
    charge_line: str
    position: str
    company: str
    start_date: str
    role: str

class TokenData(BaseModel):
    sub: Optional[str] = None # JWT의 'subject' 클레임 (보통 사용자 ID)
    role: Optional[str] = None # 토큰에 역할 정보도 포함시켰다면 추가
