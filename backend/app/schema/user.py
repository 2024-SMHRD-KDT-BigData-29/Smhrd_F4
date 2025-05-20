# Pydantic 스키마 정의 (입출력 데이터 구조)
# Pydantic
# API 요청/응답의 데이터 구조를 정의하고 검증·직렬화해주는 도구

# 왜 사용/
# API 문서 자동 생성
# 데이터 검증 자동 처리 (email에 숫자 오면 에러 같은)


# 사용자의 HTTP 요청이 들어왔을 때 흐름:
# 1. 사용자 요청 JSON
# 2. Pydantic => 데이터 검증
# 3. SQLAlchemy => DB 읽기 / 쓰기
# 4. 응답 JSON <= 다시 Pydantic이 포맷팅

# 밑에는 예시코드임
# =================================================

# from pydantic import BaseModel
#
# class UserCreate(BaseModel):
#     username: str
#     email: str
#     password: str
#
# class UserResponse(BaseModel):
#     id: int
#     username: str
#     email: str
#
#     class Config:
#         orm_mode = True  # SQLAlchemy 모델도 처리 가능하게 함



