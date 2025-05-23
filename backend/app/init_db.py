# init_db.py
from app.db.database import Base, engine
from app.model import sensor_data_model, user_model, sensor_equip_model, edge_board_model  # 모든 모델 import

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)  # 모델 기반으로 테이블 재생성
    print("✅ 테이블 생성 완료")
