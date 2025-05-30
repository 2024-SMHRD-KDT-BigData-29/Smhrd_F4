{
 "cells": [
  {
   "cell_type": "code",
   "execution_count": 1,
   "id": "47b9d5fe-d026-4614-a321-68152760cc14",
   "metadata": {},
   "outputs": [
    {
     "name": "stdout",
     "output_type": "stream",
     "text": [
      "이상\n"
     ]
    }
   ],
   "source": [
    "import joblib\n",
    "import pandas as pd\n",
    "\n",
    "# 모델 로드\n",
    "model = joblib.load(\"isoforest_temp_humidity.pkl\")\n",
    "scaler = joblib.load(\"scaler_temp_humidity.pkl\")\n",
    "\n",
    "# 새 데이터 입력\n",
    "temp = 24       # 센서 데이터\n",
    "humidity = 75   # 센서 데이터\n",
    "new_data = pd.DataFrame([[temp, humidity]], columns=[\"temp\", \"humidity\"])\n",
    "X_scaled = scaler.transform(new_data)\n",
    "\n",
    "# 이상치 예측\n",
    "result = model.predict(X_scaled)\n",
    "print(\"정상\" if result[0] == 1 else \"이상\")"
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
