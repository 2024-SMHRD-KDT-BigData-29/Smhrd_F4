import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Filler } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';

// 컴포넌트 Import
import DataCard from '../components/dashboard/DataCard';
import TimeSeriesChartCard from '../components/dashboard/TimeSeriesChartCard';
import DailyAverageChartCard from '../components/dashboard/DailyAverageChartCard';
import TempHumidityTextCard from '../components/dashboard/TempHumidityTextCard'; // <<--- 새로 추가된 컴포넌트 import
import ComfortStatusCard from '../components/dashboard/ComfortStatusCard'; // <<--- 새로 추가
import AlertHistoryCard from '../components/dashboard/AlertHistoryCard';

import './DashboardPage.css';

// Chart.js 모듈 전역 등록
ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Filler
);

// --- Helper 함수, 초기 상태 정의 (컴포넌트 함수 바깥) ---

const getCssVariable = (name) => {
  if (typeof document !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  return '';
};

// --- 컴포넌트 외부 상수 및 헬퍼 함수 ---
const MAX_HISTORY_LENGTH = 20;


const getAqiColor = (aqiValue) => {
    if (aqiValue <= 50) return getCssVariable('--aqi-good') || '#2ecc71';
    if (aqiValue <= 100) return getCssVariable('--aqi-moderate') || '#f1c40f';
    if (aqiValue <= 150) return getCssVariable('--aqi-unhealthy-sensitive') || '#e67e22';
    if (aqiValue <= 200) return getCssVariable('--aqi-unhealthy') || '#e74c3c';
    return getCssVariable('--aqi-very-unhealthy') || '#c0392b';
};

const calculateAqi = (pm25) => {
  if (pm25 === undefined || pm25 === null || isNaN(pm25)) return { value: 0, status_text: '데이터 없음' }; // status_text로 통일
  let value = 0;
  let status_text = '좋음'; // status_text로 통일
  if (pm25 <= 15) { value = Math.round(pm25 * (50/15)); status_text = '좋음'; }
  else if (pm25 <= 35) { value = Math.round(50 + (pm25 - 15) * (50/20)); status_text = '보통'; }
  else if (pm25 <= 75) { value = Math.round(100 + (pm25 - 35) * (50/40)); status_text = '민감군주의'; }
  else { value = Math.min(200, Math.round(150 + (pm25 - 75) * (50 / (200-75) ))); status_text = '나쁨'; }
  return { value, status_text };
};

const getAqiChartData = (aqiValue = 0) => {
  const value = Math.min(aqiValue, 200);
  const aqiColor = getAqiColor(value);
  return {
    labels: ['AQI 값', '나머지'],
    datasets: [{
      label: '현재 종합 공기질',
      data: [value, Math.max(0, 200 - value)],
      backgroundColor: [aqiColor, '#E0E0E0'],
      borderColor: [aqiColor, '#E0E0E0'],
      borderWidth: 1, circumference: 180, rotation: 270,
    }],
  };
};

const getAqiChartOptions = (aqiValue = 0, statusText = '-') => {
  const value = Math.min(aqiValue, 200);
  const aqiColor = getAqiColor(value);
  return {
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    plugins: {
      legend: { display: false }, tooltip: { enabled: false },
      doughnutTextPlugin: {
          text: statusText,
          value: String(value),
          valueColor: aqiColor,
          textColor: getCssVariable('--text-primary') || '#000000'
      }
    }
  };
};

const doughnutTextPlugin = {
  id: 'doughnutTextPlugin',
  afterDraw(chart) {
    const textPluginOptions = chart.options.plugins?.doughnutTextPlugin;
    if (textPluginOptions && typeof textPluginOptions.value !== 'undefined' && typeof textPluginOptions.text !== 'undefined') {
      const { ctx, chartArea: { top, width, height } } = chart;
      ctx.save();
      const text = textPluginOptions.text;
      const value = textPluginOptions.value;
      const fontFamily = getCssVariable('--font-family') || 'sans-serif';

      ctx.font = `bold ${height / 4.5}px ${fontFamily}`;
      ctx.fillStyle = textPluginOptions.valueColor || getCssVariable('--text-primary') || '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(value, width / 2, height / 1.9 + top);

      ctx.font = `${height / 11}px ${fontFamily}`;
      ctx.fillStyle = textPluginOptions.textColor || getCssVariable('--text-secondary') || '#666666';
      ctx.fillText(text, width / 2, height / 1.9 + top + (height / 5) * 0.75);
      ctx.restore();
    }
  }
};
ChartJS.register(doughnutTextPlugin);

const createMiniLineData = (historicalData = [], colorVar, label) => {
  const MAX_POINTS = 20;
  const recentData = historicalData.slice(-MAX_POINTS);
  const labels = recentData.map((_, index) => index + 1);
  const color = getCssVariable(colorVar) || '#000000';

  return {
    labels: labels,
    datasets: [{
      label: label,
      data: recentData.map(d => d.value),
      borderColor: color,
      backgroundColor: `${color}1A`,
      fill: true, tension: 0.4, borderWidth: 1,
      pointRadius: 0, pointHoverRadius: 0
    }],
  };
};

const smallLineChartOptions = {
  responsive: true, maintainAspectRatio: false,
  scales: { x: { display: false }, y: { display: false } },
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  elements: { point: { radius: 0 } },
  animation: { duration: 200 }
};

const initialTimeSeriesData = {
  labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
  datasets: [
    {
      label: 'PM2.5',
      data: [12, 13, 15, 18, 22, 25, 23, 20, 18, 20, 24, 28, 30, 27, 25, 22, 24, 28, 32, 30, 26, 22, 18, 15],
      borderColor: getCssVariable('--color-pm25') || '#3498db',
      backgroundColor: (getCssVariable('--color-pm25') || '#3498db') + '0D',
      fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3,
      pointBackgroundColor: getCssVariable('--color-pm25') || '#3498db',
      pointBorderColor: 'rgba(255,255,255,0.8)', pointHoverRadius: 5
    },
    {
      label: 'PM10',
      data: [20, 22, 25, 28, 30, 33, 31, 28, 25, 28, 32, 35, 38, 35, 33, 30, 32, 36, 40, 38, 33, 28, 24, 20],
      borderColor: getCssVariable('--color-pm10') || '#f39c12',
      backgroundColor: (getCssVariable('--color-pm10') || '#f39c12') + '0D',
      fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3,
      pointBackgroundColor: getCssVariable('--color-pm10') || '#f39c12',
      pointBorderColor: 'rgba(255,255,255,0.8)', pointHoverRadius: 5
    }
  ]
};

const timeSeriesChartOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
        x: { grid: { display: false, drawBorder: false }, ticks: { maxTicksLimit: 12, autoSkipPadding: 20, color: getCssVariable('--text-secondary') || '#666' } },
        y: { beginAtZero: true, grid: { color: getCssVariable('--border-color') || '#e0e0e0', drawBorder: false }, ticks: { padding: 10, color: getCssVariable('--text-secondary') || '#666' } }
    },
    plugins: {
        legend: { position: 'top', align: 'end', labels: { boxWidth:12, padding:25, color: getCssVariable('--text-primary') || '#000', usePointStyle:true, pointStyle:'circle' } },
        tooltip: {  mode: 'index',
            intersect: false,
            backgroundColor: getCssVariable('--sidebar-bg') || 'rgba(0, 0, 0, 0.8)', // 어두운 배경 유지 또는 변경
            padding: 12,
            boxPadding: 6,
            caretPadding: 10,
            titleFont: {
                size: 14,
                weight: 'bold'}, bodyFont:{size:13} }
    },
    interaction:{ mode:'index', intersect:false },
    layout: { padding: { top: 10, bottom: 10, left: 10, right: 20 } }
};

const initialDailyAverageData = {
  labels: ['D-6','D-5','D-4','D-3','D-2','D-1','오늘'],
  datasets: [
    {
      label: 'PM2.5 평균', data: [25, 23, 28, 26, 30, 27, 22],
      backgroundColor: getCssVariable('--color-pm25') || '#3498db',
      borderColor: getCssVariable('--color-pm25') || '#3498db',
      borderWidth:1, borderRadius: 5, barPercentage:0.6, categoryPercentage:0.8
    },
    {
      label: 'PM10 평균', data: [33, 31, 36, 34, 38, 35, 30],
      backgroundColor: getCssVariable('--color-pm10') || '#f39c12',
      borderColor: getCssVariable('--color-pm10') || '#f39c12',
      borderWidth:1, borderRadius: 5, barPercentage:0.6, categoryPercentage:0.8
    }
  ]
};

const dailyAverageChartOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
        x: { grid: { display: false, drawBorder: false }, ticks: {color: getCssVariable('--text-secondary') || '#666'} },
        y: { beginAtZero: true, grid: { color: getCssVariable('--border-color') || '#e0e0e0', drawBorder: false }, ticks: { padding: 10, color: getCssVariable('--text-secondary') || '#666' } }
    },
    plugins: {
        legend: { position:'top', align:'end', labels: { boxWidth:12, padding:25, color: getCssVariable('--text-primary') || '#000', usePointStyle:true, pointStyle:'circle' } },
        tooltip: { mode:'index', intersect:false, backgroundColor: getCssVariable('--sidebar-bg') || '#fff', titleFont:{size:14, weight:'bold'}, bodyFont:{size:13}, padding:12, boxPadding:6, caretPadding: 10 }
    },
    layout: { padding: { bottom: 10, left:10, right:10, top:10 } }
};

// 알림 목록 API 호출
const fetchAlertHistory = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/alert/history`);
    if (!res.ok) throw new Error('Failed to fetch alert history');
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};

const markAlertAsRead = async (a_idx) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/alert/${a_idx}/read`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to mark alert as read');
  } catch (err) {
    console.error(err);
  }
};

const mockDashboardNotifications = [
  { a_idx: 1, a_date: new Date(Date.now() - 300000).toISOString(), a_message: '클린룸 A-1 PM2.5 수치 경고 (55µg/m³). 확인 바랍니다.', a_type: 'error', is_read: false, device_identifier: 'FAB1-RPi-001' },
  { a_idx: 2, a_date: new Date(Date.now() - 1800000).toISOString(), a_message: '공조 장치 #FAN-001이(가) 수동으로 꺼졌습니다.', a_type: 'warning', is_read: false, device_identifier: 'hvac-fan-001' },
];
const formatNotificationTime = (isoString) => { if (!isoString) return '-'; try { return new Date(isoString).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit', hour12:true });} catch(e){return '시간오류';}};

const API_BASE_URL = 'http://127.0.0.1:8000'; // 실제 API 주소로 변경 필요

const getLatestSensorDataAPI = async (seIdx) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sensor/latest?se_idx=${seIdx}`);
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Sensor data not found for se_idx: ${seIdx}`);
        return null;
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Failed to fetch sensor data:", error);
    return null;
  }
};
// ▼▼▼ 시간별 PM 데이터 API 호출 함수 (새로 추가 또는 기존 위치) ▼▼▼
const getHourlyPmDataAPI = async (sensorId, hours = 24) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sensor/pm/hourly?se_idx=${sensorId}&hours=${hours}`);
    if (!response.ok) {
      throw new Error(`API Error for hourly PM data: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch hourly PM data:", error);
    return [];
  }
};
// --- ▲▲▲ API Service 종료 ---

// ▼▼▼ 시간별 전력량 데이터 API 호출 함수 (새로 추가) ▼▼▼
const getHourlyPowerConsumptionAPI = async (equipmentId, hours = 24) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/power/hourly_consumption?he_idx=${equipmentId}&hours=${hours}`);
    if (!response.ok) {
      throw new Error(`API Error for hourly power data: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch hourly power consumption data:", error);
    return [];
  }
};
// --- ▲▲▲ API Service 종료 ---


const generateRandomValue = (min, max, decimals = 1) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
};

const getMockDataForDevice = (deviceId) => {
  const mockCurrentSensorData = {
    pm25: generateRandomValue(5, 50),
    pm10: generateRandomValue(10, 70),
    temp: generateRandomValue(18, 32),
    humidity: generateRandomValue(30, 70, 0),
  };

  const mockAqiInfo = calculateAqi(mockCurrentSensorData.pm25);
  const mockComfortStatus = calculateComfortStatus(mockCurrentSensorData);

  const mockPmTimeSeries = {
    labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
    datasets: [
      {
        label: `PM2.5 (장치 ${deviceId})`,
        data: Array.from({ length: 24 }, () => generateRandomValue(5, 50)),
        borderColor: getCssVariable('--color-pm25') || '#3498db',
        backgroundColor: (getCssVariable('--color-pm25') || '#3498db') + '0D',
        fill: true, tension: 0.4, borderWidth: 2,
      },
      {
        label: `PM10 (장치 ${deviceId})`,
        data: Array.from({ length: 24 }, () => generateRandomValue(10, 70)),
        borderColor: getCssVariable('--color-pm10') || '#f39c12',
        backgroundColor: (getCssVariable('--color-pm10') || '#f39c12') + '0D',
        fill: true, tension: 0.4, borderWidth: 2,
      }
    ]
  };

  const mockPowerTimeSeries = {
    labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
    datasets: [
      {
        label: `전력 사용량 (W) (장치 ${deviceId})`,
        data: Array.from({ length: 24 }, () => generateRandomValue(50, 200, 0)),
        borderColor: getCssVariable('--color-power-consumption') || '#8e44ad',
        backgroundColor: (getCssVariable('--color-power-consumption') || '#8e44ad') + '0D',
        fill: true, tension: 0.4, borderWidth: 2,
      }
    ]
  };

  const mockPm25History = Array.from({ length: MAX_HISTORY_LENGTH }, () => ({ value: generateRandomValue(5, 50), time: new Date() }));
  const mockPm10History = Array.from({ length: MAX_HISTORY_LENGTH }, () => ({ value: generateRandomValue(10, 70), time: new Date() }));

  return {
    currentSensorData: mockCurrentSensorData,
    aqiInfo: mockAqiInfo,
    comfortStatus: mockComfortStatus,
    pmTimeSeries: mockPmTimeSeries,
    powerTimeSeries: mockPowerTimeSeries,
    pm25History: mockPm25History,
    pm10History: mockPm10History,
  };
};








// DashboardPage.jsx 파일 상단 또는 헬퍼 함수 영역에 추가

const calculateComfortStatus = (sensorData) => {
  const { temp, humidity, pm25, pm10 } = sensorData;

  // 모든 값이 유효한 숫자인지 확인 (API 응답이 null/undefined일 수 있음)
  if (
    typeof temp !== 'number' || isNaN(temp) ||
    typeof humidity !== 'number' || isNaN(humidity) ||
    typeof pm25 !== 'number' || isNaN(pm25) ||
    typeof pm10 !== 'number' || isNaN(pm10)
  ) {
    return '데이터 부족'; // 또는 '계산 불가' 등
  }

  const isTempComfortable = temp >= 21 && temp <= 26;
  const isHumidityComfortable = humidity >= 35 && humidity <= 60;
  const isPm25Comfortable = pm25 < 15;
  const isPm10Comfortable = pm10 < 30;

  if (isTempComfortable && isHumidityComfortable && isPm25Comfortable && isPm10Comfortable) {
    return '쾌적';
  } else {
    return '혼잡'; // "쾌적하지 않음"을 의미
  }
};

function DashboardPage({ userRole, currentUser }) {
  const [currentSensorData, setCurrentSensorData] = useState({
    pm25: 0, pm10: 0, temp: 0, humidity: 0,
  });
  const [selectedDeviceId, setSelectedDeviceId] = useState(1);
  const [aqiInfo, setAqiInfo] = useState({ value: 0, status_text: '로딩중...' });
  const [comfortStatus, setComfortStatus] = useState('계산중...'); // <<--- 새로 추가
  const [pm25History, setPm25History] = useState([]);
  const [pm10History, setPm10History] = useState([]);
  // const [tempHistory, setTempHistory] = useState([]);       // 주석 처리: TempHumidityTextCard는 이력 차트 사용 안 함
  // const [humidityHistory, setHumidityHistory] = useState([]); // 주석 처리: TempHumidityTextCard는 이력 차트 사용 안 함

  // ▼▼▼ 시간별 미세먼지 차트 데이터 상태 ▼▼▼
  const [timeSeriesData, setTimeSeriesData] = useState({
    labels: [],
    datasets: [
      { label: 'PM2.5', data: [], borderColor: getCssVariable('--color-pm25') || '#3498db', backgroundColor: (getCssVariable('--color-pm25') || '#3498db') + '0D', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3, pointBackgroundColor: getCssVariable('--color-pm25') || '#3498db', pointBorderColor: 'rgba(255,255,255,0.8)', pointHoverRadius: 5 },
      { label: 'PM10', data: [], borderColor: getCssVariable('--color-pm10') || '#f39c12', backgroundColor: (getCssVariable('--color-pm10') || '#f39c12') + '0D', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3, pointBackgroundColor: getCssVariable('--color-pm10') || '#f39c12', pointBorderColor: 'rgba(255,255,255,0.8)', pointHoverRadius: 5 }
    ]
  });
  const [loadingTimeSeries, setLoadingTimeSeries] = useState(true);
  // ▲▲▲ 시간별 미세먼지 차트 데이터 상태 ▲▲▲

  // ▼▼▼ 시간별 전력량 차트 데이터 상태 추가 ▼▼▼
  const [powerConsumptionData, setPowerConsumptionData] = useState({
    labels: [],
    datasets: [
      {
        label: '전력 사용량 (W)',
        data: [],
        borderColor: getCssVariable('--color-temp') || '#e74c3c',
        backgroundColor: (getCssVariable('--color-temp') || '#e74c3c') + '0D',
        fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3,
        pointBackgroundColor: getCssVariable('--color-temp') || '#e74c3c',
        pointBorderColor: 'rgba(255,255,255,0.8)', pointHoverRadius: 5
      },
    ],
  });
  const [loadingPowerConsumption, setLoadingPowerConsumption] = useState(true);
  const [noPowerDataToday, setNoPowerDataToday] = useState(false); // <<--- 추가

  // ▲▲▲ 시간별 전력량 차트 데이터 상태 추가 ▲▲▲





  // const [dailyAverageData, setDailyAverageData] = useState(initialDailyAverageData);
  const [alerts, setAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const notificationPanelRef = useRef(null);




  const MAX_HISTORY_LENGTH = 30; // PM2.5, PM10 히스토리에만 사용됨

  // useEffect에서 알림 데이터 로드
  useEffect(() => {
    const loadAlerts = async () => {
      const data = await fetchAlertHistory();
      const formatted = data.map(n => ({
        ...n,
        displayTime: new Date(n.a_date).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        safeType: n.a_type.replace(/\./g, '').replace(/\s/g, '') // 예: "pm2.5이상" → "pm25이상"
      }));
      setAlerts(formatted);
    };
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAlertClick = async (a_idx) => {
    await markAlertAsRead(a_idx);
    setAlerts(prev =>
      prev.map(alert =>
        alert.a_idx === a_idx ? { ...alert, is_read: true } : alert
      )
    );
  };

  // AlertHistoryCard 사용
  <AlertHistoryCard
    title="최근 알림 이력"
    alerts={alerts}
    onConfirm={handleAlertClick}
  />


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);


// 실제 공정데이터와 가데이터 대시보드 표현 구분 !!!
  useEffect(() => {
    const fetchDataAndUpdateDashboard = async () => {
      console.log(`fetchDataAndUpdateDashboard called - Device ID: ${selectedDeviceId}`);
      try {
        if (selectedDeviceId === 1) {
          // ✅ 실데이터 처리
          const [thData, pmData] = await Promise.all([
            getLatestSensorDataAPI(1),
            getLatestSensorDataAPI(2)
          ]);

          const temp = thData?.temp ?? 0;
          const humidity = thData?.humidity ?? 0;
          const pm10 = pmData?.pm10 ?? 0;
          const pm25 = pmData?.pm25 ?? 0;

          const newSensorData = { temp, humidity, pm10, pm25 };
          setCurrentSensorData(newSensorData);

          const currentComfortStatus = calculateComfortStatus(newSensorData);
          setComfortStatus(currentComfortStatus);

          const calculatedAqi = calculateAqi(pm25);
          setAqiInfo({
            value: calculatedAqi.value,
            status_text: calculatedAqi.status_text,
          });

          const now = new Date();
          setPm25History(prev => [...prev.slice(-MAX_HISTORY_LENGTH + 1), { value: pm25, time: now }]);
          setPm10History(prev => [...prev.slice(-MAX_HISTORY_LENGTH + 1), { value: pm10, time: now }]);

        } else {
          // ✅ 가데이터 처리
          const mock = getMockDataForDevice(selectedDeviceId);
          setCurrentSensorData(mock.currentSensorData);
          setAqiInfo(mock.aqiInfo);
          setComfortStatus(mock.comfortStatus);
          setPm25History(mock.pm25History);
          setPm10History(mock.pm10History);
        }
      } catch (error) {
        console.error("Error in fetchDataAndUpdateDashboard:", error);
        setAqiInfo({ value: 0, status_text: '오류' });
        setComfortStatus('오류');
      }
    };

    fetchDataAndUpdateDashboard();

    // ✅ 실데이터에만 주기적 fetch (가데이터는 정적)
    let intervalId = null;
    if (selectedDeviceId === 1) {
      intervalId = setInterval(fetchDataAndUpdateDashboard, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedDeviceId]); // ✅ 공정 선택 변경 시 재호출


   // ▼▼▼ useEffect 2: 시간별 미세먼지 차트 데이터 로드 (컴포넌트 마운트 시 1회) ▼▼▼
  useEffect(() => {
    const fetchTimeSeriesPmData = async () => {
      setLoadingTimeSeries(true);
      const pmSensorId = 2; // 실제 PM 센서의 se_idx로 변경 필요
      const hoursToFetch = 24;
      console.log("Fetching hourly PM data for chart...");
      const hourlyData = await getHourlyPmDataAPI(pmSensorId, hoursToFetch);
      console.log("API Response for hourly PM data (se_idx=2):", hourlyData);
      if (hourlyData && hourlyData.length > 0) {
        const labels = hourlyData.map(item => {
          const date = new Date(item.timestamp);
          return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        });
        const pm25Values = hourlyData.map(item => item.pm25);
        const pm10Values = hourlyData.map(item => item.pm10);

        setTimeSeriesData(prevData => ({
          labels: labels,
          datasets: [
            { ...prevData.datasets[0], data: pm25Values },
            { ...prevData.datasets[1], data: pm10Values }
          ]
        }));
      } else {
        console.warn(`No hourly PM data for se_idx=${pmSensorId}, or an error occurred. Resetting chart.`);
        setTimeSeriesData({ // 데이터 없을 시 차트 초기화
            labels: [],
            datasets: [
                { ...timeSeriesData.datasets[0], data: [] }, // 기존 스타일 유지를 위해 ...initialTimeSeriesData.datasets[0] 대신 사용
                { ...timeSeriesData.datasets[1], data: [] }
            ]
        });
      }
      setLoadingTimeSeries(false);
    };

    fetchTimeSeriesPmData();
    // 필요시 주기적 업데이트 로직 추가
    // const chartIntervalId = setInterval(fetchTimeSeriesPmData, 3600000); // 예: 1시간마다
    // return () => clearInterval(chartIntervalId);
  }, []); // timeSeriesData.datasets를 의존성 배열에 추가하여 초기값 구조 유지
  // ▲▲▲ useEffect 2 종료 ▲▲▲

  // ▼▼▼ useEffect 3: 시간별 전력량 차트 데이터 로드 (수정됨) ▼▼▼
  useEffect(() => {
    const fetchHourlyPowerData = async () => {
      setLoadingPowerConsumption(true);
      const targetHeIdxForPower = 1;
      const hoursToFetch = 24;

      const hourlyPowerData = await getHourlyPowerConsumptionAPI(targetHeIdxForPower, hoursToFetch);

      if (hourlyPowerData && hourlyPowerData.length > 0) {
        const labels = hourlyPowerData.map(item => {
          const date = new Date(item.timestamp);
          return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        });
        const wattageValues = hourlyPowerData.map(item => item.wattage);

        setPowerConsumptionData(prevData => ({
          labels,
          datasets: [{ ...prevData.datasets[0], data: wattageValues }]
        }));
        setNoPowerDataToday(false); // ✅ 데이터 존재함
      } else {
        setPowerConsumptionData(prevData => ({
          labels: [],
          datasets: [{ ...prevData.datasets[0], data: [] }]
        }));
        setNoPowerDataToday(true); // ✅ 오늘 데이터 없음 표시
      }
      setLoadingPowerConsumption(false);
    };

    fetchHourlyPowerData();
  }, []);
  // --- ▲▲▲ useEffect 3 종료 ---





  useEffect(() => {
    const loadInitialNotifications = () => {
      const formattedMockNotifications = mockDashboardNotifications.map(n => ({ ...n, displayTime: formatNotificationTime(n.a_date) }));
      setNotifications(formattedMockNotifications);
    };
    loadInitialNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target)) {
        if (!event.target.closest('.notification-bell')) { setShowNotifications(false); }
      }
    }
    if (showNotifications) { document.addEventListener('mousedown', handleClickOutside); }
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [showNotifications]);

  const toggleNotifications = () => setShowNotifications(prev => !prev);
  const handleNotificationClick = async (notification_a_idx) => {
    try {
      await fetch(`${API_BASE_URL}/api/alert/${notification_a_idx}/read`, {
        method: 'POST'
      });

      setNotifications(prev =>
        prev.map(n =>
          n.a_idx === notification_a_idx ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  };

  const currentAqiChartData = getAqiChartData(aqiInfo.value);
  const currentAqiChartOptions = getAqiChartOptions(aqiInfo.value, aqiInfo.status_text);

  const pm25MiniLineData = createMiniLineData(pm25History, '--color-pm25', 'PM2.5');
  const pm10MiniLineData = createMiniLineData(pm10History, '--color-pm10', 'PM10');
  // tempMiniLineData와 humidityMiniLineData는 더 이상 사용하지 않으므로 주석 처리
  // const tempMiniLineData = createMiniLineData(tempHistory, '--color-temp', '온도');
  // const humidityMiniLineData = createMiniLineData(humidityHistory, '--color-humidity', '습도');

  return (
    <div className="dashboard-page-content">
    <header className="main-header">
      <div className="header-top-container">
        {/* 타이틀, 인사말, 장비 선택 드롭다운을 한 줄로 배치 */}
        <div className="header-title-section enhanced-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {/* 왼쪽: 제목 + 사용자 인사 */}
            <div>
              <h2 className="header-main-title">공장 공기질 요약</h2>
              {currentUser?.m_name && (
                <span className="header-sub-text">
                  (안녕하세요, {currentUser.m_name}님)
                </span>
              )}
            </div>

            {/* 오른쪽: 장비 선택 드롭다운 */}
            <div className="device-title-select-inline">
              <label htmlFor="device-select" className="device-label">장비 선택:</label>
              <select
                id="device-select"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(parseInt(e.target.value, 10))}
                className="device-select-large"
              >
                <option value={1}>S1-MetaLab</option>
                <option value={2}>S1-DataHub</option>
                <option value={3}>S1-ControlRoom</option>
                <option value={4}>S1-FactoryZone</option>
                <option value={5}>S1-DeviceZone</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 알림 영역은 그대로 유지 */}
      <div className="header-actions">
        <div className="notification-area">
          <button onClick={() => setShowNotifications(prev => !prev)} className="notification-bell">
            <i className="fas fa-bell"></i>
            {alerts.filter(a => !a.is_read).length > 0 && (
              <span className="notification-badge">
                {alerts.filter(a => !a.is_read).length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div ref={notificationPanelRef} className="notification-panel">
              <div className="notification-panel-header">
                <h4>알림 목록</h4>
              </div>
              {alerts.length === 0 ? (
                <p className="no-notifications">새로운 알림이 없습니다.</p>
              ) : (
                <ul>
                  {alerts.map(alert => (
                    <li
                      key={alert.a_idx}
                      className={`notification-item ${alert.is_read ? 'read' : 'unread'} type-${alert.safeType}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p className="notification-message">{alert.a_message}</p>
                          <span className="notification-time">{alert.displayTime}</span>
                        </div>
                        {!alert.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAlertClick(alert.a_idx);
                            }}
                          >
                            확인
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </header>


      <main className="page-actual-content">
        <div className="dashboard-grid">
          <DataCard title="현재 종합 공기질 (AQI)" ChartComponent={Doughnut} chartData={currentAqiChartData} chartOptions={currentAqiChartOptions} chartPlugins={[doughnutTextPlugin]} isAQI={true} />
          <DataCard title="초미세먼지 (PM2.5)" value={currentSensorData.pm25.toFixed(1)} unit="µg/m³" ChartComponent={Line} chartData={pm25MiniLineData} chartOptions={smallLineChartOptions} />
          <DataCard title="미세먼지 (PM10)" value={currentSensorData.pm10.toFixed(1)} unit="µg/m³" ChartComponent={Line} chartData={pm10MiniLineData} chartOptions={smallLineChartOptions} />

          {/* 기존 온도, 습도 DataCard 삭제됨 */}
          <TempHumidityTextCard
            temp={currentSensorData.temp}
            humidity={currentSensorData.humidity}
          />
          {/* 새로 추가된 쾌적 상태 카드 */}
          <ComfortStatusCard status={comfortStatus} />
        </div>

       <div className="bottom-charts-row">
          <div className="left-large-chart-container card air-quality-trend-card">
            {loadingTimeSeries ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px' }}> {/* 차트 높이와 유사하게 */}
                <p>시간별 미세먼지 데이터 로딩 중...</p>
              </div>
            ) : (
              <TimeSeriesChartCard
                title="시간별 미세먼지 변화"
                chartData={timeSeriesData}
                chartOptions={timeSeriesChartOptions}
              />
            )}
          </div>
           {/* ▼▼▼ 기존 DailyAverageChartCard를 전력량 차트로 교체 ▼▼▼ */}
          <div className="right-column-container card power-consumption-trend-card">
            {loadingPowerConsumption ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px' }}>
                <p>시간별 전력 사용량 데이터 로딩 중...</p>
              </div>
            ) : noPowerDataToday ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px' }}>
                <p>오늘 사용한 전력량이 없습니다.</p>
              </div>
            ) : (
              <TimeSeriesChartCard
                title="시간별 전력 사용량 (W)"
                chartData={powerConsumptionData}
                chartOptions={timeSeriesChartOptions}
              />
            )}
          </div>
          {/* ▲▲▲ 전력량 차트로 교체 완료 ▲▲▲ */}
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;