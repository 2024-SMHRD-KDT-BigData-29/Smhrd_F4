from pydantic import BaseModel

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

class LoginRequest(BaseModel):
    m_id: str
    m_pw: str

class LoginResponse(BaseModel):
    status: str
    user: dict

class UserResponse(BaseModel):
    m_id: str
    m_name: str
    m_position: str
    com_name: str
