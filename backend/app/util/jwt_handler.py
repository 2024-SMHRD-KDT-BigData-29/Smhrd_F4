from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
EXPIRE_MINUTES = 60

def create_token(user):
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)
    payload = {
        "sub": user.m_id,
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
