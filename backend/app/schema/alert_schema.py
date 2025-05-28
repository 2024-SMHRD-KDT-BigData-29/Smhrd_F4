from pydantic import BaseModel
from datetime import datetime

class AlertWithDeviceName(BaseModel):
    a_idx: int
    m_id: str
    he_idx: int
    a_type: str
    a_date: datetime
    is_read: bool
    he_name: str  # ✅ 추가
    a_message: str  # ✅ 여기에 메시지 필드 추가

    class Config:
        orm_mode = True