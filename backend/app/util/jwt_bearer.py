# 사용자가 /api/auth/me처럼 보호된 API에 접근할 때
#
# Authorization: Bearer <JWT_TOKEN> 헤더가 포함되어야 하고
#
# 해당 토큰이 유효한지 검사함

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Request, HTTPException
from jose import JWTError
from app.util.jwt_handler import decode_token  # JWT 디코딩 함수


class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, request: Request):
        credentials: HTTPAuthorizationCredentials = await super(JWTBearer, self).__call__(request)

        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(status_code=403, detail="잘못된 인증 방식입니다. (Bearer 아님)")
            if not self.verify_jwt(credentials.credentials):
                raise HTTPException(status_code=403, detail="유효하지 않은 또는 만료된 토큰입니다.")
            return credentials.credentials
        else:
            raise HTTPException(status_code=403, detail="인증 정보가 없습니다.")

    def verify_jwt(self, jwt_token: str) -> bool:
        try:
            payload = decode_token(jwt_token)
        except JWTError:
            return False
        return True
