from pydantic import BaseModel, Field
from typing import Optional
from fastapi import APIRouter

router = APIRouter()

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


# ✅ 유저 정보 응답용
class UserResponse(BaseModel):
    m_id: str
    m_name: str
    m_position: str
    com_name: str

    class Config:
        orm_mode = True


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
        orm_mode = True
