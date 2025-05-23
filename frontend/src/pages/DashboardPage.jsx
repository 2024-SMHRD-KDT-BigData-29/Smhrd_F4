import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Filler } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2'; // Bar 임포트 추가 (DailyAverageChartCard용)

// 컴포넌트 Import (경로를 실제 프로젝트 구조에 맞게 확인하세요)
import DataCard from '../components/dashboard/DataCard';
import TimeSeriesChartCard from '../components/dashboard/TimeSeriesChartCard';
import DailyAverageChartCard from '../components/dashboard/DailyAverageChartCard';

// Chart.js 모듈 전역 등록
ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Filler
);

// --- Helper 함수, 초기 상태 정의 (컴포넌트 함수 바깥) ---

// CSS 변수에서 실제 색상 값을 가져오는 헬퍼 함수
const getCssVariable = (name) => {
  if (typeof document !== 'undefined') { // 브라우저 환경인지 확인
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  return ''; // 또는 기본값 반환
};

// AQI 값에 따른 색상 결정 헬퍼 함수
const getAqiColor = (aqiValue) => {
    if (aqiValue <= 50) return getCssVariable('--aqi-good') || '#2ecc71'; // 기본값 추가
    if (aqiValue <= 100) return getCssVariable('--aqi-moderate') || '#f1c40f';
    if (aqiValue <= 150) return getCssVariable('--aqi-unhealthy-sensitive') || '#e67e22';
    if (aqiValue <= 200) return getCssVariable('--aqi-unhealthy') || '#e74c3c';
    return getCssVariable('--aqi-very-unhealthy') || '#c0392b';
};

// AQI 계산 로직 (주의: 매우 기본적인 예시입니다. 실제 환경부 기준에 맞게 수정 필요)
const calculateAqi = (pm25) => {
  if (pm25 === undefined || pm25 === null || isNaN(pm25)) return { value: 0, status: '데이터 없음' };
  let value = 0;
  let status = '좋음';
  if (pm25 <= 15) { value = Math.round(pm25 * (50/15)); status = '좋음'; }
  else if (pm25 <= 35) { value = Math.round(50 + (pm25 - 15) * (50/20)); status = '보통'; }
  else if (pm25 <= 75) { value = Math.round(100 + (pm25 - 35) * (50/40)); status = '민감군주의'; }
  else { value = Math.min(200, Math.round(150 + (pm25 - 75) * (50 / (200-75) ))); status = '나쁨'; } // AQI 최대값을 200으로 가정
  return { value, status_text: status }; // status_text로 통일
};


// AQI 도넛 차트 데이터 및 옵션 생성 함수
const getAqiChartData = (aqiValue = 0) => {
  const value = Math.min(aqiValue, 200); // AQI 표시 최대값을 200으로 제한
  const aqiColor = getAqiColor(value);
  return {
    labels: ['AQI 값', '나머지'],
    datasets: [{
      label: '현재 종합 공기질',
      data: [value, Math.max(0, 200 - value)], // AQI 최대값을 200으로 가정
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

// 도넛 차트 중앙 텍스트 플러그인
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

// 미니 라인 차트 데이터 생성 함수
const createMiniLineData = (historicalData = [], colorVar, label) => {
  const MAX_POINTS = 20;
  const recentData = historicalData.slice(-MAX_POINTS);
  const labels = recentData.map((_, index) => index + 1);
  const color = getCssVariable(colorVar) || '#000000'; // 기본 검정색

  return {
    labels: labels,
    datasets: [{
      label: label,
      data: recentData.map(d => d.value),
      borderColor: color,
      backgroundColor: `${color}1A`, // 기본 투명도 적용
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

// --- 목업 데이터 (시간별/일별 차트용) ---
const initialTimeSeriesData = {
  labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
  datasets: [
    {
      label: 'PM2.5',
      data: [12, 13, 15, 18, 22, 25, 23, 20, 18, 20, 24, 28, 30, 27, 25, 22, 24, 28, 32, 30, 26, 22, 18, 15],
      borderColor: getCssVariable('--color-pm25') || '#3498db',
      backgroundColor: (getCssVariable('--color-pm25') || '#3498db') + '0D', // 투명도 약하게
      fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3,
      pointBackgroundColor: getCssVariable('--color-pm25') || '#3498db',
      pointBorderColor: 'rgba(255,255,255,0.8)', pointHoverRadius: 5
    },
    {
      label: 'PM10', // PM1.0 대신 PM10으로 통일 (일반적으로 더 많이 사용)
      data: [20, 22, 25, 28, 30, 33, 31, 28, 25, 28, 32, 35, 38, 35, 33, 30, 32, 36, 40, 38, 33, 28, 24, 20],
      borderColor: getCssVariable('--color-pm10') || '#f39c12', // PM10 색상 (CSS 변수 또는 기본값)
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

// 알림 Mock 데이터
const mockDashboardNotifications = [
  { a_idx: 1, a_date: new Date(Date.now() - 300000).toISOString(), a_message: '클린룸 A-1 PM2.5 수치 경고 (55µg/m³). 확인 바랍니다.', a_type: 'error', is_read: false, device_identifier: 'FAB1-RPi-001' },
  { a_idx: 2, a_date: new Date(Date.now() - 1800000).toISOString(), a_message: '공조 장치 #FAN-001이(가) 수동으로 꺼졌습니다.', a_type: 'warning', is_read: false, device_identifier: 'hvac-fan-001' },
];
const formatNotificationTime = (isoString) => { if (!isoString) return '-'; try { return new Date(isoString).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit', hour12:true });} catch(e){return '시간오류';}};

// --- API Service ---
const API_BASE_URL = 'http://192.168.219.193:8000';
const SENSOR_ID_FOR_DASHBOARD = 1;

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
    // throw error; // 필요에 따라 에러를 다시 throw 할 수 있음
    return null; // API 호출 실패 시 null 반환하여 UI가 깨지는 것을 방지
  }
};


// --- DashboardPage 컴포넌트 ---
function DashboardPage({ userRole, currentUser }) {
  const [currentSensorData, setCurrentSensorData] = useState({
    pm25: 0, pm10: 0, temp: 0, humidity: 0,
  });
  const [aqiInfo, setAqiInfo] = useState({ value: 0, status_text: '로딩중...' });

  const [pm25History, setPm25History] = useState([]);
  const [pm10History, setPm10History] = useState([]);
  const [tempHistory, setTempHistory] = useState([]);
  const [humidityHistory, setHumidityHistory] = useState([]);

  // 시간별/일별 차트 상태: 정의된 목업 데이터로 초기화
  const [timeSeriesData, setTimeSeriesData] = useState(initialTimeSeriesData);
  const [dailyAverageData, setDailyAverageData] = useState(initialDailyAverageData);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationPanelRef = useRef(null);

  const MAX_HISTORY_LENGTH = 30;

  // useEffect 1: 주기적인 API 데이터 가져오기 및 초기 API 호출
  useEffect(() => {
    const fetchDataAndUpdateDashboard = async () => {
      try {
        const latestData = await getLatestSensorDataAPI(SENSOR_ID_FOR_DASHBOARD);

        if (latestData && typeof latestData === 'object') { // latestData가 유효한 객체인지 확인
          setCurrentSensorData({
            pm25: latestData.pm25 || 0, // 기본값 설정
            pm10: latestData.pm10 || 0,
            temp: latestData.temp || 0,
            humidity: latestData.humidity || 0,
          });

          const calculatedAqi = calculateAqi(latestData.pm25);
          setAqiInfo({
            value: calculatedAqi.value,
            status_text: calculatedAqi.status_text,
          });

          const now = new Date();
          setPm25History(prev => [...prev.slice(-MAX_HISTORY_LENGTH + 1), { value: latestData.pm25 || 0, time: now }]);
          setPm10History(prev => [...prev.slice(-MAX_HISTORY_LENGTH + 1), { value: latestData.pm10 || 0, time: now }]);
          setTempHistory(prev => [...prev.slice(-MAX_HISTORY_LENGTH + 1), { value: latestData.temp || 0, time: now }]);
          setHumidityHistory(prev => [...prev.slice(-MAX_HISTORY_LENGTH + 1), { value: latestData.humidity || 0, time: now }]);
        } else {
          console.log("No new data received or data was null/invalid.");
          // 데이터가 없을 경우 기존 값 유지 또는 초기화
           setAqiInfo({ value: 0, status_text: '데이터 없음' });
        }
      } catch (error) { // 이 catch는 getLatestSensorDataAPI 내부에서 처리되지 않은 에러용
        console.error("Error in fetchDataAndUpdateDashboard:", error);
        setAqiInfo({ value: 0, status_text: '오류' });
      }
    };

    fetchDataAndUpdateDashboard();
    const intervalId = setInterval(fetchDataAndUpdateDashboard, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // useEffect 2: 목업 알림 데이터 로드
  useEffect(() => {
    const loadInitialNotifications = () => {
      const formattedMockNotifications = mockDashboardNotifications.map(n => ({ ...n, displayTime: formatNotificationTime(n.a_date) }));
      setNotifications(formattedMockNotifications);
    };
    loadInitialNotifications();
  }, []);

  // 알림 패널 외부 클릭 시 닫기
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
    // 실제 API 호출: await markNotificationAsReadAPI(notification_a_idx);
  };

  // 차트 데이터 준비
  const currentAqiChartData = getAqiChartData(aqiInfo.value);
  const currentAqiChartOptions = getAqiChartOptions(aqiInfo.value, aqiInfo.status_text);

  const pm25MiniLineData = createMiniLineData(pm25History, '--color-pm25', 'PM2.5');
  const pm10MiniLineData = createMiniLineData(pm10History, '--color-pm10', 'PM10'); // --color-pm10 CSS 변수 필요
  const tempMiniLineData = createMiniLineData(tempHistory, '--color-temp', '온도');
  const humidityMiniLineData = createMiniLineData(humidityHistory, '--color-humidity', '습도');

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
          <DataCard title="온도" value={currentSensorData.temp.toFixed(1)} unit="°C" ChartComponent={Line} chartData={tempMiniLineData} chartOptions={smallLineChartOptions} />
          <DataCard title="습도" value={currentSensorData.humidity.toFixed(0)} unit="%" ChartComponent={Line} chartData={humidityMiniLineData} chartOptions={smallLineChartOptions} />
        </div>

        <div className="bottom-charts-row">
          <div className="left-large-chart-container card air-quality-trend-card">
            <TimeSeriesChartCard
              title="시간별 미세먼지 변화"
              chartData={timeSeriesData}
              chartOptions={timeSeriesChartOptions}
            />
          </div>
          <div className="right-column-container card daily-air-quality-summary-card">
            <DailyAverageChartCard
              title="일별 환경 지표 요약"
              chartData={dailyAverageData} // Bar 차트 사용 시 DailyAverageChartCard 내부에서 <Bar> 컴포넌트 사용
              chartOptions={dailyAverageChartOptions}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;