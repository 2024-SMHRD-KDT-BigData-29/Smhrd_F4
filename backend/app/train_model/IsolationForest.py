{
 "cells": [
  {
   "cell_type": "code",
   "execution_count": 1,
   "id": "a969e68a-af7b-40dc-a523-f72f80202b2c",
   "metadata": {},
   "outputs": [
    {
     "data": {
      "text/plain": [
       "['scaler_pm.pkl']"
      ]
     },
     "execution_count": 1,
     "metadata": {},
     "output_type": "execute_result"
    }
   ],
   "source": [
    "import pandas as pd\n",
    "from sklearn.ensemble import IsolationForest\n",
    "from sklearn.preprocessing import StandardScaler\n",
    "import joblib\n",
    "\n",
    "# 1. CSV 파일 로드\n",
    "df = pd.read_csv(\"data.csv\")\n",
    "\n",
    "# -----------------------------\n",
    "# 2. 온습도 모델 학습 (temp + humidity)\n",
    "# -----------------------------\n",
    "# NaN 제거\n",
    "temp_humidity_df = df[[\"temp\", \"humidity\"]].dropna()\n",
    "\n",
    "# 스케일링\n",
    "scaler_temp_humidity = StandardScaler()\n",
    "X_temp_humidity = scaler_temp_humidity.fit_transform(temp_humidity_df)\n",
    "\n",
    "# Isolation Forest 모델 학습\n",
    "model_temp_humidity = IsolationForest(contamination=0.05, random_state=42)\n",
    "model_temp_humidity.fit(X_temp_humidity)\n",
    "\n",
    "# 모델 & 스케일러 저장\n",
    "joblib.dump(model_temp_humidity, \"isoforest_temp_humidity.pkl\")\n",
    "joblib.dump(scaler_temp_humidity, \"scaler_temp_humidity.pkl\")\n",
    "\n",
    "\n",
    "# -----------------------------\n",
    "# 3. 미세먼지 모델 학습 (pm10 + pm25)\n",
    "# -----------------------------\n",
    "pm_df = df[[\"pm10\", \"pm25\"]].dropna()\n",
    "\n",
    "scaler_pm = StandardScaler()\n",
    "X_pm = scaler_pm.fit_transform(pm_df)\n",
    "\n",
    "model_pm = IsolationForest(contamination=0.05, random_state=42)\n",
    "model_pm.fit(X_pm)\n",
    "\n",
    "# 모델 & 스케일러 저장\n",
    "joblib.dump(model_pm, \"isoforest_pm.pkl\")\n",
    "joblib.dump(scaler_pm, \"scaler_pm.pkl\")\n"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python [conda env:base] *",
   "language": "python",
   "name": "conda-base-py"
  },
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.12.7"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 5
}
