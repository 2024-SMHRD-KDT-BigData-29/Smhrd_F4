# app/train_model/Isolation_fred.py

import joblib
import pandas as pd
import os

# 모델 파일 경로 설정 (절대 경로 기반)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "isoforest_temp_humidity.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaler_temp_humidity.pkl")

# 모델 & 스케일러 미리 로드 (앱 시작 시 1회만)
model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

# ✅ FastAPI 등에서 import해서 사용할 함수
def predict_outlier(temp: float, humidity: float) -> bool:
    """
    temp, humidity 값을 받아서 이상치 여부 반환
    - 이상치: True
    - 정상: False
    """
    new_data = pd.DataFrame([[temp, humidity]], columns=["temp", "humidity"])
    X_scaled = scaler.transform(new_data)
    result = model.predict(X_scaled)
    return result[0] == -1
