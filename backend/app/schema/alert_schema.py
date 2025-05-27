from pydantic import BaseModel
from datetime import datetime

class AlertWithDeviceName(BaseModel):
    a_idx: int
    m_id: str
    he_idx: int
    a_type: str
    a_date: datetime
    is_read: bool
    he_name: str
    a_message: str  # ✅ 알림 메시지 포함

    class Config:
        orm_mode = True