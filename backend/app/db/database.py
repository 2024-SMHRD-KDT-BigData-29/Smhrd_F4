# app/db/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ✅ MySQL 연결 정보
DATABASE_URL = "mysql+pymysql://mp_24K_bigdata29_p3_3:smhrd3@project-db-campus.smhrd.com:3312/mp_24K_bigdata29_p3_3"

# ✅ SQLAlchemy 연결 세팅
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ 모델이 상속받는 기본 Base 클래스
Base = declarative_base()

# ✅ Dependency로 사용할 DB 세션 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
