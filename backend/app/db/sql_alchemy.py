# SQLAlchemy 모델 정의 ( FastAPI에서 쓰는 MySql ORM )

# 역할 :
# MySQL에 연결하고 데이터를 넣고, 꺼내오고, 수정, 삭제 등
# Python 객체처럼 DB를 다룰 수 있게 해줌 (= ORM)

# 밑에는 예시코드임
# ========================================================

#from sqlalchemy import Column, Integer, String
#from sqlalchemy.ext.declarative import declarative_base

#Base = declarative_base()

#class User(Base):
    # __tablename__ = "users"
    #
    # id = Column(Integer, primary_key=True, index=True)
    # username = Column(String(50), unique=True, index=True)
    # email = Column(String(100), unique=True)
    # password = Column(String(100))

