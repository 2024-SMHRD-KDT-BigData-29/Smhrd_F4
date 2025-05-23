// src/apiService.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api', // .env 값 또는 기본값
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- 인증 관련 API ---
export const loginAPI = (credentials) => {
  return apiClient.post('/auth/login', credentials);
};

export const signupAPI = (userData) => {
  return apiClient.post('/auth/signup', userData);
};

export const logoutAPI = () => {
  return apiClient.get('/auth/logout');
};

export const fetchMeAPI = () => {
  return apiClient.get('/auth/me');
};

// --- 측정 장치 (Edge Board) 관련 API ---
export const fetchDevicesAPI = () => {
  // API 명세: GET /api/devices
  // 파라미터: 명세에는 eb_idx가 응답 필드로 되어 있어, 요청 파라미터는 없어 보임.
  // 백엔드 API 구현에 따라 필요한 파라미터 (예: 필터링, 페이지네이션) 추가 가능
  return apiClient.get('/devices');
};

export const addDeviceAPI = (deviceData) => {
  // POST /api/devices (가정, API 명세에 추가 필요)
  return apiClient.post('/devices', deviceData);
};

export const updateDeviceAPI = (eb_idx, deviceData) => {
  // PUT /api/devices/{eb_idx} (가정, API 명세에 추가 필요)
  return apiClient.put(`/devices/${eb_idx}`, deviceData);
};

export const deleteDeviceAPI = (eb_idx) => {
  // DELETE /api/devices/{eb_idx} (가정, API 명세에 추가 필요)
  return apiClient.delete(`/devices/${eb_idx}`);
};

// --- 센서 데이터 및 이상 감지 관련 API ---
// POST /api/sensor/data (센서 데이터 수집 - 주로 장치에서 호출)
// POST /api/sensor/anomaly-check (이상 감지 요청 - 주로 백엔드 내부 로직)
// POST /api/sensor/log (이상 이력 저장 - 주로 백엔드 내부 로직)

export const fetchAnomalyHistoryAPI = (params) => { // 이상 이력 "조회" API
  // GET /api/alerts 또는 GET /api/sensor/logs (가정, API 명세에 추가 필요)
  // params 예: { page: 1, limit: 10, device_id: '001', type: 'anomaly' }
  return apiClient.get('/sensor/logs', { params }); // 엔드포인트 및 파라미터는 백엔드와 협의
};


// --- 대시보드 관련 API ---
export const fetchDashboardLiveDataAPI = (eb_idx) => {
  // GET /api/dashboard/live
  return apiClient.get('/dashboard/live', { params: { eb_idx } });
};
// 추가적인 대시보드용 집계/통계 API 함수 정의 필요 (API 명세 확정 후)
// export const fetchDashboardSummaryAPI = () => { ... };
// export const fetchTimeSeriesDataAPI = (params) => { ... };


// --- 공조 설비 관련 API ---
export const fetchHvacEquipmentsAPI = () => {
  // GET /api/hvac-equipments (가정, API 명세에 추가 필요)
  return apiClient.get('/hvac-equipments');
};

export const controlHvacAPI = (controlData) => {
  // POST /api/control/send
  // controlData: { he_idx: ..., c_hvac: ..., c_role: ..., c_type: ... }
  return apiClient.post('/control/send', controlData);
};


// --- 전력량 관련 API ---
// POST /api/power/log (전력량 저장 - 주로 장치에서 호출)
// export const fetchPowerDataAPI = (params) => { ... }; // 전력량 조회 API (필요시)


// --- 알림 관련 API ---
export const fetchNotificationsAPI = (params) => {
  // GET /api/alerts (가정, API 명세에 추가 필요)
  // params 예: { limit: 5, unreadOnly: true }
  return apiClient.get('/alerts', { params }); // 엔드포인트 및 파라미터는 백엔드와 협의
};

export const markNotificationAsReadAPI = (a_idx) => {
  // PUT 또는 POST /api/alerts/{a_idx}/read (가정, API 명세에 추가 필요)
  return apiClient.post(`/alerts/${a_idx}/read`);
};
export const fetchLatestSensorDataForDashboardAPI = (se_idx) => {
  // API 명세서에는 /api/sensor/latest?se_idx=1 로 되어 있으므로,
  // apiClient의 baseURL에 /api 가 포함되어 있다면 '/sensor/latest' 만 사용
  // baseURL에 /api 가 없다면 '/api/sensor/latest' 사용
  return apiClient.get(`/sensor/latest?se_idx=${se_idx}`); // 경로 확인!
};

// apiClient 인스턴스를 직접 export할 필요는 없음 (각 함수를 export하므로)
// export default apiClient; // 이 라인 삭제 또는 주석 처리 권장