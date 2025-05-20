import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Filler } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';

// 컴포넌트 Import (경로를 실제 프로젝트 구조에 맞게 확인하세요)
import DataCard from '../components/dashboard/DataCard';
import TimeSeriesChartCard from '../components/dashboard/TimeSeriesChartCard';
import DailyAverageChartCard from '../components/dashboard/DailyAverageChartCard';

// API 서비스 Import (실제 연동 시 주석 해제 및 경로 확인)
// import {
//   getDashboardOverviewAPI, // 예시: 대시보드 전체 개요 데이터 (AQI, 센서 요약)
//   getTimeSeriesDataAPI,    // 예시: 시간별 센서 데이터
//   getDailyAverageDataAPI,  // 예시: 일별 평균 센서 데이터
//   getNotificationsAPI,       // 예시: 알림 목록 조회
//   markNotificationAsReadAPI  // 예시: 알림 읽음 처리
// } from '../apiService';

// Chart.js 모듈 전역 등록
ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Filler
);

// --- Helper 함수, Mock 데이터 및 초기 상태 정의 (컴포넌트 함수 바깥) ---

// CSS 변수에서 실제 색상 값을 가져오는 헬퍼 함수
const getCssVariable = (name) => {
  if (typeof document !== 'undefined') { // 브라우저 환경인지 확인
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  return ''; // 또는 기본값 반환
};

// 1. 초기 대시보드 개요 데이터
const initialDashboardOverview = {
  pm25: 18.8,
  pm10: 27.5,
  temp: 25.9,
  humidity: 36,
  aqi_value: 59,
  aqi_status_text: '보통',
};

// AQI 값에 따른 색상 결정 헬퍼 함수
const getAqiColor = (aqiValue) => {
    if (aqiValue <= 50) return getCssVariable('--aqi-good');
    if (aqiValue <= 100) return getCssVariable('--aqi-moderate');
    if (aqiValue <= 150) return getCssVariable('--aqi-unhealthy-sensitive');
    if (aqiValue <= 200) return getCssVariable('--aqi-unhealthy');
    return getCssVariable('--aqi-very-unhealthy');
};

// 2. AQI 도넛 차트 데이터 및 옵션 생성 함수
const getAqiChartData = (aqiValue = 0) => {
  const aqiColor = getAqiColor(aqiValue);
  return {
    labels: ['AQI 값', '나머지'],
    datasets: [{
      label: '현재 종합 공기질',
      data: [aqiValue, Math.max(0, 200 - aqiValue)],
      backgroundColor: [aqiColor, '#E0E0E0'], // 동적으로 색상 적용
      borderColor: [aqiColor, '#E0E0E0'],
      borderWidth: 1, circumference: 180, rotation: 270,
    }],
  };
};

const getAqiChartOptions = (aqiValue = 0, statusText = '-') => {
  const aqiColor = getAqiColor(aqiValue);
  return {
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    plugins: {
      legend: { display: false }, tooltip: { enabled: false },
      doughnutTextPlugin: {
          text: statusText,
          value: String(aqiValue),
          valueColor: aqiColor, // 동적으로 색상 적용
          textColor: getCssVariable('--text-primary') // 텍스트 색상도 변수 사용
      }
    }
  };
};

// 도넛 차트 중앙 텍스트 플러그인 (font-family 변수 사용하도록 수정)
const doughnutTextPlugin = {
  id: 'doughnutTextPlugin',
  afterDraw(chart) {
    const textPluginOptions = chart.options.plugins?.doughnutTextPlugin;
    if (textPluginOptions && typeof textPluginOptions.value !== 'undefined' && typeof textPluginOptions.text !== 'undefined') {
      const { ctx, chartArea: { top, width, height } } = chart;
      ctx.save();
      const text = textPluginOptions.text;
      const value = textPluginOptions.value;

      // AQI 값 폰트 스타일
      ctx.font = `bold ${height / 4.5}px ${getCssVariable('--font-family')}`; // 폰트 크기 및 폰트 패밀리 적용
      ctx.fillStyle = textPluginOptions.valueColor || getCssVariable('--text-primary');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(value, width / 2, height / 1.9 + top); // 값 위치 미세 조정

      // 상태 텍스트 폰트 스타일
      ctx.font = `${height / 11}px ${getCssVariable('--font-family')}`; // 폰트 크기 및 폰트 패밀리 적용
      ctx.fillStyle = textPluginOptions.textColor || getCssVariable('--text-secondary');
      ctx.fillText(text, width / 2, height / 1.9 + top + (height / 5) * 0.75); // 텍스트 위치 미세 조정
      ctx.restore();
    }
  }
};
ChartJS.register(doughnutTextPlugin); // 전역 등록

// 3. 미니 라인 차트 데이터 (DataCard 내부용)
const mockMiniChartTrace = { labels: ['1','2','3','4','5','6','7'], data: [15,18,17,20,18,19,18] };
const pm25MiniLineData = {
  labels: mockMiniChartTrace.labels,
  datasets: [{
    label: 'PM2.5',
    data: mockMiniChartTrace.data,
    borderColor: getCssVariable('--color-pm25'),
    backgroundColor: getCssVariable('--color-pm25') ? `${getCssVariable('--color-pm25')}1A` : 'rgba(52, 152, 219, 0.1)', // #RRGGBB + 1A (투명도)
    fill: true, tension: 0.5, borderWidth: 0.5,
    pointRadius: 0, // ⭐ 점(point)을 제거 (기존 0이어서 잘 되어있었음. 혹시 몰라 다시 명시)
    pointHoverRadius: 0 // ⭐ 마우스 오버 시에도 점을 보이지 않게
  }],
};
const pm10MiniLineData = {
  labels: mockMiniChartTrace.labels,
  datasets: [{
    label: 'PM1.0',
    data: [25,22,26,24,27.5,25,28],
    borderColor: getCssVariable('--color-pm1'),
    backgroundColor: getCssVariable('--color-pm1') ? `${getCssVariable('--color-pm1')}1A` : 'rgba(230, 126, 34, 0.1)',
    fill: true, tension: 0.5, borderWidth: 0.5,
    pointRadius: 0, // ⭐ 점 제거
    pointHoverRadius: 0 // ⭐ 마우스 오버 시 점 제거
  }],
};
const tempMiniLineData = {
  labels: mockMiniChartTrace.labels,
  datasets: [{
    label: '온도',
    data: [25,25.5,26,25.8,25.9,26.2,25.7],
    borderColor: getCssVariable('--color-temp'),
    backgroundColor: getCssVariable('--color-temp') ? `${getCssVariable('--color-temp')}1A` : 'rgba(231, 76, 60, 0.1)',
    fill: true, tension: 0.4, borderWidth: 0.5,
    pointRadius: 0, // ⭐ 점 제거
    pointHoverRadius: 0 // ⭐ 마우스 오버 시 점 제거
  }],
};
const humidityMiniLineData = {
  labels: mockMiniChartTrace.labels,
  datasets: [{
    label: '습도',
    data: [30,32,35,33,36,34,37],
    borderColor: getCssVariable('--color-humidity'),
    backgroundColor: getCssVariable('--color-humidity') ? `${getCssVariable('--color-humidity')}1A` : 'rgba(39, 174, 96, 0.1)',
    fill: true, tension: 0.4, borderWidth: 0.5,
    pointRadius: 0, // ⭐ 점 제거
    pointHoverRadius: 0 // ⭐ 마우스 오버 시 점 제거
  }],
};

const smallLineChartOptions = {
  responsive: true, maintainAspectRatio: false,
  scales: { x: { display: false }, y: { display: false } },
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  elements: {
      point: { radius: 0 }
  },
  animation: { duration: 0 }
};

// 4. 시간별 미세먼지 변화 차트 데이터 및 옵션 (TimeSeriesChartCard용)
const initialTimeSeriesData = {
  labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
  datasets: [
    { label: 'PM2.5', data: [10,12,15,20,22,18,16,17,25,30,32,28,26,24,22,28,35,40,38,30,25,20,18,15],
      borderColor: getCssVariable('--color-pm25'),
      backgroundColor: getCssVariable('--color-pm25') ? `${getCssVariable('--color-pm25')}0D` : 'rgba(52,152,219,0.05)', // #RRGGBB + 0D (투명도)
      fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3,
      pointBackgroundColor: getCssVariable('--color-pm25'), pointBorderColor: 'rgba(255,255,255,0.8)', pointHoverRadius: 5
    },
    { label: 'PM1.0', data: [15,18,22,28,30,25,22,24,33,38,40,35,33,30,28,35,45,50,48,38,32,28,25,20],
      borderColor: getCssVariable('--color-pm1'),
      backgroundColor: getCssVariable('--color-pm1') ? `${getCssVariable('--color-pm1')}0D` : 'rgba(230,126,34,0.05)',
      fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3,
      pointBackgroundColor: getCssVariable('--color-pm1'), pointBorderColor: 'rgba(255,255,255,0.8)', pointHoverRadius: 5
    }
  ]
};
const timeSeriesChartOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
        x: {
            grid: { display: false, drawBorder: false },
            ticks: { maxTicksLimit: 12, autoSkipPadding: 20, color: getCssVariable('--text-secondary') }
        },
        y: {
            beginAtZero: true,
            grid: { color: getCssVariable('--border-color'), drawBorder: false }, // 그리드 선 색상 변경 및 표시
            ticks: { padding: 10, color: getCssVariable('--text-secondary') }
        }
    },
    plugins: {
        legend: {
            position: 'top', align: 'end',
            labels: { boxWidth:12, padding:25, color: getCssVariable('--text-primary'), usePointStyle:true, pointStyle:'circle' }
        },
        tooltip: {
            mode:'index', intersect:false,
            backgroundColor: getCssVariable('--sidebar-bg'), // 툴팁 배경색 조정
            titleFont:{size:14, weight:'bold'},
            bodyFont:{size:13},
            padding:12, boxPadding:6,
            caretPadding: 10
        }
    },
    interaction:{ mode:'index', intersect:false },
    layout: { padding: { top: 10, bottom: 10, left: 10, right: 20 } }
};

// 5. 일별 환경 지표 요약 차트 데이터 및 옵션 (DailyAverageChartCard용)
const initialDailyAverageData = {
  labels: ['D-6','D-5','D-4','D-3','D-2','D-1','오늘'],
  datasets: [
    { label: 'PM2.5 평균', data: [22,25,23,28,26,30,27],
      backgroundColor: getCssVariable('--color-pm25'), // CSS 변수 사용
      borderColor: getCssVariable('--color-pm25'), // CSS 변수 사용
      borderWidth:1, borderRadius: 5, barPercentage:0.6, categoryPercentage:0.8
    },
    { label: 'PM1.0 평균', data: [30,33,31,36,34,38,35],
      backgroundColor: getCssVariable('--color-pm1'), // CSS 변수 사용
      borderColor: getCssVariable('--color-pm1'), // CSS 변수 사용
      borderWidth:1, borderRadius: 5, barPercentage:0.6, categoryPercentage:0.8
    }
  ]
};
const dailyAverageChartOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
        x: {
            grid: { display: false, drawBorder: false },
            ticks: {color: getCssVariable('--text-secondary')}
        },
        y: {
            beginAtZero: true,
            grid: { color: getCssVariable('--border-color'), drawBorder: false },
            ticks: { padding: 10, color: getCssVariable('--text-secondary') }
        }
    },
    plugins: {
        legend: {
            position:'top', align:'end',
            labels: { boxWidth:12, padding:25, color: getCssVariable('--text-primary'), usePointStyle:true, pointStyle:'circle' }
        },
        tooltip: {
            mode:'index', intersect:false,
            backgroundColor: getCssVariable('--sidebar-bg'), // 툴팁 배경색 조정
            titleFont:{size:14, weight:'bold'},
            bodyFont:{size:13},
            padding:12, boxPadding:6,
            caretPadding: 10
        }
    },
    layout: { padding: { bottom: 10, left:10, right:10, top:10 } }
};

// 6. 알림 Mock 데이터 (tb_alert 기반)
const mockDashboardNotifications = [
  { a_idx: 1, a_date: new Date(Date.now() - 300000).toISOString(), a_message: '클린룸 A-1 PM2.5 수치 경고 (55µg/m³). 확인 바랍니다.', a_type: 'error', is_read: false, device_identifier: 'FAB1-RPi-001' },
  { a_idx: 2, a_date: new Date(Date.now() - 1800000).toISOString(), a_message: '공조 장치 #FAN-001이(가) 수동으로 꺼졌습니다.', a_type: 'warning', is_read: false, device_identifier: 'hvac-fan-001' },
  { a_idx: 3, a_date: new Date(Date.now() - 7200000).toISOString(), a_message: '사무실 B 에어컨이 예약 가동되었습니다.', a_type: 'info', is_read: true, device_identifier: 'hvac-ac-001' },
  { a_idx: 4, a_date: new Date(Date.now() - 10800000).toISOString(), a_message: '서버룸 전력 사용량 이상 감지. 즉시 확인 필요.', a_type: 'error', is_read: false, device_identifier: 'server-power-001' },
  { a_idx: 5, a_date: new Date(Date.now() - 18000000).toISOString(), a_message: '센서 #TEMP-005 데이터 전송 지연 발생.', a_type: 'warning', is_read: true, device_identifier: 'sensor-temp-005' },
];
const formatNotificationTime = (isoString) => { if (!isoString) return '-'; try { return new Date(isoString).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit', hour12:true });} catch(e){return '시간오류';}};


// --- DashboardPage 컴포넌트 ---
function DashboardPage({ userRole, currentUser }) {
  const [dashboardOverview, setDashboardOverview] = useState(initialDashboardOverview);
  const [timeSeriesData, setTimeSeriesData] = useState(initialTimeSeriesData);
  const [dailyAverageData, setDailyAverageData] = useState(initialDailyAverageData);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationPanelRef = useRef(null);

  const currentAqiChartData = getAqiChartData(dashboardOverview.aqi_value);
  const currentAqiChartOptions = getAqiChartOptions(dashboardOverview.aqi_value, dashboardOverview.aqi_status_text);

  useEffect(() => {
    const fetchAllDashboardData = async () => {
      // Mock 데이터 사용 (API 연동 전)
      setDashboardOverview(initialDashboardOverview);
      // CSS 변수를 기반으로 동적으로 차트 데이터 생성
      // 이 시점에 CSS 변수 값을 가져와야 함
      const newTimeSeriesData = {
        labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
        datasets: [
          { label: 'PM2.5', data: [10,12,15,20,22,18,16,17,25,30,32,28,26,24,22,28,35,40,38,30,25,20,18,15],
            borderColor: getCssVariable('--color-pm25'),
            backgroundColor: getCssVariable('--color-pm25') ? `${getCssVariable('--color-pm25')}0D` : 'rgba(52,152,219,0.05)',
            fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3,
            pointBackgroundColor: getCssVariable('--color-pm25'), pointBorderColor: 'rgba(255,255,255,0.8)', pointHoverRadius: 5
          },
          { label: 'PM1.0', data: [15,18,22,28,30,25,22,24,33,38,40,35,33,30,28,35,45,50,48,38,32,28,25,20],
            borderColor: getCssVariable('--color-pm1'),
            backgroundColor: getCssVariable('--color-pm1') ? `${getCssVariable('--color-pm1')}0D` : 'rgba(230,126,34,0.05)',
            fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3,
            pointBackgroundColor: getCssVariable('--color-pm1'), pointBorderColor: 'rgba(255,255,255,0.8)', pointHoverRadius: 5
          }
        ]
      };
      setTimeSeriesData(newTimeSeriesData);

      const newDailyAverageData = {
        labels: ['D-6','D-5','D-4','D-3','D-2','D-1','오늘'],
        datasets: [
          { label: 'PM2.5 평균', data: [22,25,23,28,26,30,27],
            backgroundColor: getCssVariable('--color-pm25'),
            borderColor: getCssVariable('--color-pm25'),
            borderWidth:1, borderRadius: 5, barPercentage:0.6, categoryPercentage:0.8
          },
          { label: 'PM1.0 평균', data: [30,33,31,36,34,38,35],
            backgroundColor: getCssVariable('--color-pm1'),
            borderColor: getCssVariable('--color-pm1'),
            borderWidth:1, borderRadius: 5, barPercentage:0.6, categoryPercentage:0.8
          }
        ]
      };
      setDailyAverageData(newDailyAverageData);

      const formattedMockNotifications = mockDashboardNotifications.map(n => ({ ...n, displayTime: formatNotificationTime(n.a_date) }));
      setNotifications(formattedMockNotifications);
    };
    fetchAllDashboardData();
  }, []); // 빈 배열은 컴포넌트 마운트 시 한 번만 실행되도록 함

  const toggleNotifications = () => setShowNotifications(prev => !prev);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target)) {
        if (!event.target.closest('.notification-bell')) { setShowNotifications(false); }
      }
    }
    if (showNotifications) { document.addEventListener('mousedown', handleClickOutside); }
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [showNotifications]);

  const handleNotificationClick = async (notification_a_idx) => {
    console.log("Notification clicked (a_idx):", notification_a_idx);
    setNotifications(prev => prev.map(n => n.a_idx === notification_a_idx ? { ...n, is_read: true } : n));
    // 실제 API 호출: await markNotificationAsReadAPI(notification_a_idx);
  };

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
                    {/* is_read 상태에 따라 클래스 추가 */}
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
          {/* DataCard에 isAQI 속성 추가 및 AQI 차트 플러그인 전달 */}
          <DataCard title="현재 종합 공기질 (AQI)" ChartComponent={Doughnut} chartData={currentAqiChartData} chartOptions={currentAqiChartOptions} chartPlugins={[doughnutTextPlugin]} isAQI={true} />
          <DataCard title="초미세먼지 (PM2.5)" value={dashboardOverview.pm25.toFixed(1)} unit="µg/m³" ChartComponent={Line} chartData={pm25MiniLineData} chartOptions={smallLineChartOptions} />
          <DataCard title="미세먼지 (PM10)" value={dashboardOverview.pm10.toFixed(1)} unit="µg/m³" ChartComponent={Line} chartData={pm10MiniLineData} chartOptions={smallLineChartOptions} />
          <DataCard title="온도" value={dashboardOverview.temp.toFixed(1)} unit="°C" ChartComponent={Line} chartData={tempMiniLineData} chartOptions={smallLineChartOptions} />
          <DataCard title="습도" value={dashboardOverview.humidity.toFixed(0)} unit="%" ChartComponent={Line} chartData={humidityMiniLineData} chartOptions={smallLineChartOptions} />
        </div>

        <div className="bottom-charts-row">
          {/* TimeSeriesChartCard와 DailyAverageChartCard에 card 클래스 직접 추가 */}
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
              chartData={dailyAverageData}
              chartOptions={dailyAverageChartOptions}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;