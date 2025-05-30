# app/api/power.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
# from sqlalchemy import desc # 현재 코드에서는 desc 사용 안 함
from typing import List, Optional # Optional 사용 시 추가
from datetime import datetime, timedelta, timezone

# --- 의존성 및 모델/스키마 import ---
from app.db.database import get_db
from app.model.power_data_model import PowerData as PowerDataORM
from app.schema.power_schema import PowerDataCreate, PowerDataRecordResponse, HourlyPowerConsumptionResponse

router = APIRouter(tags=["Power Consumption"]) # main.py에서 prefix="/api/power"로 포함될 것임

# 한국 시간대 (UTC+9)
KST = timezone(timedelta(hours=9))

@router.post("/data", response_model=PowerDataRecordResponse)
def create_power_data_entry(
        data: PowerDataCreate,
        db: Session = Depends(get_db)
):
    record_timestamp = data.p_data
    if record_timestamp is None:
        record_timestamp = datetime.now(timezone.utc)
    elif record_timestamp.tzinfo is None:
        record_timestamp = record_timestamp.replace(tzinfo=timezone.utc)

    db_power_entry = PowerDataORM(
        he_idx=data.he_idx,
        p_data=record_timestamp,
        p_power=data.p_power
    )
    try:
        db.add(db_power_entry)
        db.commit()
        db.refresh(db_power_entry)
        print(
            f"[SAVED POWER DATA] For he_idx: {db_power_entry.he_idx}, Time: {db_power_entry.p_data}, Power: {db_power_entry.p_power}, p_idx: {db_power_entry.p_idx}")
        return db_power_entry
    except Exception as e:
        db.rollback()
        print(f"Error saving power data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"전력 데이터 저장에 실패했습니다: {str(e)}")


@router.get("/hourly_consumption", response_model=List[HourlyPowerConsumptionResponse])
def get_hourly_power_consumption(
    he_idx: int = Query(..., description="조회할 장비의 ID (he_idx)"),
    hours: int = Query(24, description="조회할 최근 시간 범위 (기본값: 24시간)", ge=1, le=168 * 2),
    db: Session = Depends(get_db)
):
    # ✅ KST 기준 현재 시각
    end_time_kst = datetime.now(KST)
    start_time_kst = end_time_kst - timedelta(hours=hours)

    print(f"[Power API] he_idx={he_idx} 시간 범위 (KST): {start_time_kst.isoformat()} ~ {end_time_kst.isoformat()}")

    try:
        query_results = (
            db.query(
                PowerDataORM.created_at.label("timestamp"),
                PowerDataORM.p_power.label("wattage")
            )
            .filter(
                PowerDataORM.he_idx == he_idx,
                PowerDataORM.created_at >= start_time_kst,
                PowerDataORM.created_at <= end_time_kst
            )
            .order_by(PowerDataORM.created_at.asc())
            .all()
        )

        print(f"[Power API] 조회된 전력 데이터 개수: {len(query_results)}개")
        return query_results
    except Exception as e:
        print(f"[ERROR] 시간별 전력 데이터 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="시간별 전력량 데이터 조회 중 오류 발생")


@router.get("/by_date", response_model=List[HourlyPowerConsumptionResponse])
def get_power_consumption_by_date(
        he_idx: int = Query(..., description="조회할 장비의 ID (he_idx)"),
        date: str = Query(..., description="조회할 날짜 (YYYY-MM-DD 형식)"),
        db: Session = Depends(get_db)
):
    """
    지정된 he_idx와 날짜(YYYY-MM-DD)에 대해 시간별 전력 소비량 데이터를 반환합니다.
    """
    print(f"--- Attempting to GET power data for he_idx: {he_idx} on date: {date} ---")
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d")
        start_time_naive_utc = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
        end_time_naive_utc = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59, 999999)

        print(f"Querying power data for he_idx={he_idx} on date={date}")
        print(f"Time range (naive UTC for query): {start_time_naive_utc.isoformat()} TO {end_time_naive_utc.isoformat()}")

        query_results = (
            db.query(
                PowerDataORM.created_at.label("timestamp"),  # ← 수정됨
                PowerDataORM.p_power.label("wattage")
            )
            .filter(
                PowerDataORM.he_idx == he_idx,
                PowerDataORM.created_at >= start_time_naive_utc,  # ← 수정됨
                PowerDataORM.created_at <= end_time_naive_utc  # ← 수정됨
            )
            .order_by(PowerDataORM.created_at.asc())  # ← 수정됨
            .all()
        )

        print(f"SQL query for power data by date found {len(query_results)} records.")
        return query_results
    except ValueError:
        print(f"Invalid date format received: {date}")
        raise HTTPException(status_code=400, detail="날짜 형식이 잘못되었습니다. YYYY-MM-DD 형식을 사용해주세요.")
    except Exception as e:
        print(f"Error fetching power data by date: {str(e)}")
        raise HTTPException(status_code=500, detail="일별 전력량 데이터 조회 중 오류가 발생했습니다.")

@router.get("/all_data", response_model=List[HourlyPowerConsumptionResponse])
def get_all_power_data(
    he_idx: int = Query(..., description="장비 ID (he_idx)"),
    db: Session = Depends(get_db)
):
    try:
        results = (
            db.query(
                PowerDataORM.created_at.label("timestamp"),  # ✅ 컬럼명 변경 반영
                PowerDataORM.p_power.label("wattage")
            )
            .filter(PowerDataORM.he_idx == he_idx)
            .order_by(PowerDataORM.created_at.asc())
            .all()
        )
        return results
    except Exception as e:
        print(f"[ERROR] 전체 전력 데이터 로드 실패: {e}")
        raise HTTPException(status_code=500, detail="전체 전력 데이터 조회 중 오류 발생")

