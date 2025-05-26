import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Filler } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';

// 컴포넌트 Import
import DataCard from '../components/dashboard/DataCard';
import TimeSeriesChartCard from '../components/dashboard/TimeSeriesChartCard';
import DailyAverageChartCard from '../components/dashboard/DailyAverageChartCard';
import TempHumidityTextCard from '../components/dashboard/TempHumidityTextCard'; // <<--- 새로 추가된 컴포넌트 import
import ComfortStatusCard from '../components/dashboard/ComfortStatusCard'; // <<--- 새로 추가

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
        tooltip: { mode:'index', intersect:false, backgroundColor: getCssVariable('--sidebar-bg') || '#fff', titleFont:{size:14, weight:'bold'}, bodyFont:{size:13}, padding:12, boxPadding:6, caretPadding: 10 }
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

const mockDashboardNotifications = [
  { a_idx: 1, a_date: new Date(Date.now() - 300000).toISOString(), a_message: '클린룸 A-1 PM2.5 수치 경고 (55µg/m³). 확인 바랍니다.', a_type: 'error', is_read: false, device_identifier: 'FAB1-RPi-001' },
  { a_idx: 2, a_date: new Date(Date.now() - 1800000).toISOString(), a_message: '공조 장치 #FAN-001이(가) 수동으로 꺼졌습니다.', a_type: 'warning', is_read: false, device_identifier: 'hvac-fan-001' },
];
const formatNotificationTime = (isoString) => { if (!isoString) return '-'; try { return new Date(isoString).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit', hour12:true });} catch(e){return '시간오류';}};

const API_BASE_URL = 'http://192.168.219.193:8000'; // 실제 API 주소로 변경 필요

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
  const [aqiInfo, setAqiInfo] = useState({ value: 0, status_text: '로딩중...' });
  const [comfortStatus, setComfortStatus] = useState('계산중...'); // <<--- 새로 추가
  const [pm25History, setPm25History] = useState([]);
  const [pm10History, setPm10History] = useState([]);
  // const [tempHistory, setTempHistory] = useState([]);       // 주석 처리: TempHumidityTextCard는 이력 차트 사용 안 함
  // const [humidityHistory, setHumidityHistory] = useState([]); // 주석 처리: TempHumidityTextCard는 이력 차트 사용 안 함

  const [timeSeriesData, setTimeSeriesData] = useState(initialTimeSeriesData);
  const [dailyAverageData, setDailyAverageData] = useState(initialDailyAverageData);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationPanelRef = useRef(null);

  const MAX_HISTORY_LENGTH = 30; // PM2.5, PM10 히스토리에만 사용됨

  useEffect(() => {
    const fetchDataAndUpdateDashboard = async () => {
      try {
        const [thData, pmData] = await Promise.all([
          getLatestSensorDataAPI(1),
          getLatestSensorDataAPI(2)
        ]);

        const temp = thData?.temp ?? 0;
        const humidity = thData?.humidity ?? 0;
        const pm10 = pmData?.pm10 ?? 0;
        const pm25 = pmData?.pm25 ?? 0;

        const newSensorData = { temp, humidity, pm10, pm25 };
        setCurrentSensorData(newSensorData); // 센서 데이터 상태 업데이트

                // --- 쾌적 상태 계산 및 업데이트 추가 ---
        const currentComfortStatus = calculateComfortStatus(newSensorData);
        setComfortStatus(currentComfortStatus);
        // ------------------------------------






        const calculatedAqi = calculateAqi(pm25);
        setAqiInfo({
          value: calculatedAqi.value,
          status_text: calculatedAqi.status_text,
        });

        const now = new Date();
        setPm25History(prev => [...prev.slice(-MAX_HISTORY_LENGTH + 1), { value: pm25, time: now }]);
        setPm10History(prev => [...prev.slice(-MAX_HISTORY_LENGTH + 1), { value: pm10, time: now }]);
        // Temp/Humidity history 상태 업데이트 로직은 더 이상 필요 없음
        // setTempHistory(prev => [...prev.slice(-MAX_HISTORY_LENGTH + 1), { value: temp, time: now }]);
        // setHumidityHistory(prev => [...prev.slice(-MAX_HISTORY_LENGTH + 1), { value: humidity, time: now }]);

      } catch (error) {
        console.error("Error in fetchDataAndUpdateDashboard:", error);
        setAqiInfo({ value: 0, status_text: '오류' });
        setComfortStatus('오류'); // 오류 발생 시 쾌적 상태도 오류로 표시
      }
    };

    fetchDataAndUpdateDashboard();
    const intervalId = setInterval(fetchDataAndUpdateDashboard, 5000);
    return () => clearInterval(intervalId);
  }, []);

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
    setNotifications(prev => prev.map(n => n.a_idx === notification_a_idx ? { ...n, is_read: true } : n));
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
        <div className="header-title-section">
          <h2>공장 공기질 요약</h2>
          {currentUser && currentUser.m_name &&
            <span style={{marginLeft: '15px', fontSize: '0.95em', color: 'var(--text-secondary)'}}>
              (안녕하세요, {currentUser.m_name}님)
            </span>
          }
        </div>
        <div className="header-actions">
          <div className="notification-area">
            <button onClick={toggleNotifications} className="notification-bell">
              <i className="fas fa-bell"></i>
              {notifications.filter(n => !n.is_read).length > 0 &&
                <span className="notification-badge">{notifications.filter(n => !n.is_read).length}</span>
              }
            </button>
            {showNotifications && (
              <div ref={notificationPanelRef} className="notification-panel">
                <div className="notification-panel-header"><h4>알림 목록</h4></div>
                {notifications.length > 0 ? (
                  <ul>
                    {notifications.map(notif => (
                      <li key={notif.a_idx} className={`notification-item ${notif.is_read ? 'read' : 'unread'} type-${notif.a_type}`} onClick={() => handleNotificationClick(notif.a_idx)}>
                        <p className="notification-message">{notif.a_message}</p>
                        <span className="notification-time">{notif.displayTime}</span>
                      </li>
                    ))}
                  </ul>
                ) : (<p className="no-notifications">새로운 알림이 없습니다.</p>)}
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
            <TimeSeriesChartCard
              title="시간별 미세먼지 변화"
              chartData={timeSeriesData} // 현재 목업 데이터 사용
              chartOptions={timeSeriesChartOptions}
            />
          </div>
          <div className="right-column-container card daily-air-quality-summary-card">
            <DailyAverageChartCard
              title="일별 환경 지표 요약"
              chartData={dailyAverageData} // 현재 목업 데이터 사용
              chartOptions={dailyAverageChartOptions}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;