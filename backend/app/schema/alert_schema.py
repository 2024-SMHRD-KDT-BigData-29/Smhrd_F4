from pydantic import BaseModel
from datetime import datetime

class AlertResponse(BaseModel):
    a_idx: int
    m_id: str
    he_idx: int
    a_type: str
    a_date: datetime

    class Config:
        orm_mode = True
