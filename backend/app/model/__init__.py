# backend/app/model/__init__.py
from .user_model import User
from .edge_board_model import EdgeBoard
from .sensor_device_model import SensorDevice
from .sensor_data_model import SensorData
from .hvac_model import HvacEquipment # 만약 있다면
from .control_model import ControlLog # 만약 있다면
from .alert_model import Alert       # 만약 있다면