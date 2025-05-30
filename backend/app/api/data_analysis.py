from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.db.database import get_db
from app.model.sensor_data_model import SensorData
from datetime import datetime
from collections import defaultdict

router = APIRouter(prefix="/api/data_analysis", tags=["DataAnalysis"])

# ✅ 수집된 센서 데이터 요약 통계 조회 (GET /summary)
@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    try:
        # 온도/습도 센서 (se_idx=1)
        temp_count = db.query(func.count()).filter(SensorData.se_idx == 1).scalar()
        temp_avg = db.query(
            func.avg(SensorData.temp),
            func.avg(SensorData.humidity)
        ).filter(SensorData.se_idx == 1).one()

        # 미세먼지 센서 (se_idx=2)
        pm_count = db.query(func.count()).filter(SensorData.se_idx == 2).scalar()
        pm_avg = db.query(
            func.avg(SensorData.pm10),
            func.avg(SensorData.pm25)
        ).filter(SensorData.se_idx == 2).one()

        return {
            "temperature_data_count": temp_count,
            "avg_temp": round(temp_avg[0] or 0, 2),
            "avg_humidity": round(temp_avg[1] or 0, 2),
            "pm_data_count": pm_count,
            "avg_pm10": round(pm_avg[0] or 0, 2),
            "avg_pm25": round(pm_avg[1] or 0, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"요약 통계 조회 실패: {str(e)}")


# ✅ 일별 이상치 개수 통계 조회 (GET /outliers-by-day)
@router.get("/outliers-by-day")
def get_outlier_count_by_day(db: Session = Depends(get_db)):
    try:
        results = (
            db.query(
                extract('year', SensorData.created_at).label("year"),
                extract('month', SensorData.created_at).label("month"),
                extract('day', SensorData.created_at).label("day"),
                func.count().label("outlier_count")
            )
            .filter(SensorData.outlier == True)
            .group_by("year", "month", "day")
            .order_by("year", "month", "day")
            .all()
        )

        grouped = [
            {
                "date": f"{int(r.year):04d}-{int(r.month):02d}-{int(r.day):02d}",
                "count": r.outlier_count
            }
            for r in results
        ]

        return grouped

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"일별 이상치 통계 조회 실패: {str(e)}")
