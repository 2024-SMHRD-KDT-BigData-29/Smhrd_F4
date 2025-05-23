# backend/app/api/devices.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional  # Optional 추가
from datetime import datetime, timezone, date  # date 추가

# 경로를 실제 프로젝트 구조에 맞게 수정하세요
from ..db.database import get_db
from ..model.edge_board_model import EdgeBoard  # SQLAlchemy 모델
from ..model.sensor_device_model import SensorDevice  # SQLAlchemy 모델
from ..model.sensor_data_model import SensorData  # SQLAlchemy 모델
from ..schema import device_schema
from ..schema.device_schema import DeviceResponse, DeviceCreate, DeviceUpdate  # Pydantic 스키마

print("✅✅✅ [devices.py] 모듈 최상단이 실행되고 있습니다! ✅✅✅")
router = APIRouter()


@router.get("/", response_model=List[device_schema.DeviceResponse])
async def read_all_devices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    print("--- API: read_all_devices CALLED ---")
    # 1. tb_edge_board에서 모든 장치 기본 정보 조회
    db_edge_boards = db.query(EdgeBoard).order_by(EdgeBoard.eb_idx).offset(skip).limit(limit).all()
    print(f"1. Fetched EdgeBoards from DB: {len(db_edge_boards)} items")
    if not db_edge_boards:
        print("No EdgeBoards found in DB. Returning empty list.")
        return []

    response_devices = []
    for i, db_eb in enumerate(db_edge_boards):
        print(
            f"\n--- Processing EdgeBoard {i + 1}: eb_idx={db_eb.eb_idx} (DB type: {type(db_eb.eb_idx)}), Name='{db_eb.eb_name}' ---")

        latest_sensor_values = {"pm25": None, "pm10": None, "temp": None, "humidity": None}
        latest_data_timestamp: Optional[datetime] = None
        current_device_status = "offline"  # 기본값

        # 2. 현재 EdgeBoard(db_eb)에 연결된 SensorDevice(들)의 se_idx를 찾습니다.
        #    tb_edge_board에 se_idx 컬럼이 직접 있다면 그것을 사용하거나,
        #    tb_sensor_equip 테이블에서 eb_idx를 참조하는 레코드를 찾습니다.
        #    DB 스키마에 따르면 tb_edge_board에 se_idx가 FK로 있습니다.
        if db_eb.se_idx:  # EdgeBoard 모델에 se_idx 속성이 있고, 값이 있다면
            print(f"2. EdgeBoard has se_idx: {db_eb.se_idx}")
            # 해당 se_idx를 가진 센서의 최신 데이터 조회
            latest_sensor_entry = db.query(SensorData) \
                .filter(SensorData.se_idx == db_eb.se_idx) \
                .order_by(desc(SensorData.created_at)) \
                .first()

            if latest_sensor_entry:
                print(
                    f"3. Latest SensorData for se_idx {db_eb.se_idx}: {latest_sensor_entry.created_at if latest_sensor_entry.created_at else 'No timestamp'}")
                if latest_sensor_entry.created_at:
                    latest_sensor_values["pm25"] = latest_sensor_entry.pm25
                    latest_sensor_values["pm10"] = latest_sensor_entry.pm10
                    latest_sensor_values["temp"] = latest_sensor_entry.temp
                    latest_sensor_values["humidity"] = latest_sensor_entry.humidity
                    latest_data_timestamp = latest_sensor_entry.created_at
            else:
                print(f"3. No SensorData found for se_idx {db_eb.se_idx}")
        else:
            print(f"2. No se_idx found for EdgeBoard '{db_eb.eb_idx}'.")

        # 3. 상태 결정
        if latest_data_timestamp:
            timestamp_to_compare = latest_data_timestamp
            if timestamp_to_compare.tzinfo is None:  # naive datetime 이면 UTC로 가정
                timestamp_to_compare = timestamp_to_compare.replace(tzinfo=timezone.utc)

            if (datetime.now(timezone.utc) - timestamp_to_compare).total_seconds() < 300:  # 5분 이내
                current_device_status = "online"
        print(
            f"4. Determined status for '{db_eb.eb_idx}': {current_device_status}, lastUpdate: {latest_data_timestamp}")

        # 4. DeviceResponse 스키마에 맞춰 데이터 구성
        #    eb_serial_num은 DB에 없으므로, 스키마에서도 Optional이거나 제거되어야 함
        device_info_payload = {
            "eb_idx": str(db_eb.eb_idx),  # 프론트엔드가 문자열 ID를 기대할 수 있음
            "m_id": db_eb.m_id,
            "eb_name": db_eb.eb_name,
            "eb_serial_num": None,  # DB에 해당 컬럼이 없으므로 None 또는 스키마에서 제거
            "install_date": db_eb.install_date,  # Date 객체
            "eb_loc": db_eb.eb_loc,
            "status": current_device_status,
            "pm25": latest_sensor_values["pm25"],
            "pm10": latest_sensor_values["pm10"],
            "temp": latest_sensor_values["temp"],
            "humidity": latest_sensor_values["humidity"],
            "lastUpdate": latest_data_timestamp  # datetime 객체 또는 None
        }
        try:
            device_info = device_schema.DeviceResponse(**device_info_payload)
            response_devices.append(device_info)
            print(f"5. Appended device_info for '{db_eb.eb_idx}'. Count: {len(response_devices)}")
        except Exception as e:
            print(f"ERROR creating DeviceResponse for eb_idx {db_eb.eb_idx}: {e}")
            print(f"Payload was: {device_info_payload}")

    print(f"--- read_all_devices RETURNING: {len(response_devices)} items ---")
    return response_devices


# TODO: POST, PUT, DELETE 엔드포인트도 유사하게 인증 없이 DB 로직 직접 포함하여 구현
# @router.post("/", response_model=device_schema.DeviceResponse, status_code=status.HTTP_201_CREATED)
# async def create_new_device_entry(device_in: device_schema.DeviceCreate, db: Session = Depends(get_db)):
#     # 여기에 DB에 새 장치 추가하는 로직 (device_in.m_id는 요청 본문에서 받아야 함)
 # ... (이전 답변의 create_device 로직 참고, 단 get_current_active_user 없이)
# 예시: db_device_data = device_in.model_dump()
 # if not db_device_data.get('m_id'): db_device_data['m_id'] = "default_user_for_now" # 임시 처리
 # db_device = EdgeBoard(**db_device_data)
 # db.add(db_device) ...
# return {}  # 임시 반환

# ... (GET /{eb_idx_str}, PUT /{eb_idx_str}, DELETE /{eb_idx_str} 도 유사하게) ...