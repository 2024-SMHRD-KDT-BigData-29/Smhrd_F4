from fastapi import HTTPException, APIRouter
from pydantic import BaseModel
# pip install tapo
from tapo import ApiClient
import asyncio


# TAPO 접속 정보
TAPO_EMAIL = "jangone12@naver.com"
TAPO_PASSWORD = "smhrd123"
TAPO_IP = "192.168.0.129"


#asyncio.run(main())

router = APIRouter(prefix="/api", tags=["Tapo"])

# 요청 모델
class PlugCommand(BaseModel):
    action: str  # "on" or "off"

# 플러그 객체를 비동기적으로 초기화
async def get_plug():
    client = ApiClient(TAPO_EMAIL, TAPO_PASSWORD)
    return await client.p110(TAPO_IP)

@router.post("/plug")
async def control_plug(cmd: PlugCommand):
    plug = await get_plug()
    try:
        if cmd.action.lower() == "on":
            await plug.on()
        elif cmd.action.lower() == "off":
            await plug.off()
        else:
            raise HTTPException(status_code=400, detail="Invalid action: use 'on' or 'off'")
        return {"status": "success", "action": cmd.action}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plug/energy")
async def get_energy():
    plug = await get_plug()
    try:
        energy = await plug.get_energy_usage()
        return {
            "status": "success",
            "current_power_mw": energy.current_power,
            "today_energy_wh": energy.today_energy,
            "month_energy_wh": energy.month_energy
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plug/status")
async def get_status():
    plug = await get_plug()
    try:
        info = await plug.get_device_info()
        return {"status": "success", "device_info": info.to_dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

