// src/pages/DashboardPage.js
import React,{useState, useEffect, useRef} from 'react';
// Chart.js 및 react-chartjs-2 관련 import (기존과 동일)
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Filler } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';

// 직접 만든 컴포넌트들 import (Sidebar import 제거)
import DataCard from '../../frontend/src/components/dashboard/DataCard';
import TimeSeriesChartCard from '../../frontend/src/components/dashboard/TimeSeriesChartCard';
import DailyAverageChartCard from '../../frontend/src/components/dashboard/DailyAverageChartCard';
import AlertHistoryCard from '../../frontend/src/components/dashboard/AlertHistoryCard';

// Chart.js 모듈 등록 (기존과 동일)
ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Filler
);

// 스타일 객체 (Sidebar 관련 스타일 제거, 필요시 App.css로 통합)
const styles = {
  dashboardContainer: { // App.js의 .app-container가 이 역할을 하므로, 여기서는 불필요하거나 내부 패딩만 정의
    // display: 'flex', // App.js에서 이미 flex 레이아웃 처리
    // height: '100vh', // App.js에서 이미 처리
    fontFamily: 'Arial, sans-serif',
    // overflow: 'hidden', // App.js에서 main-content 영역에 적용
  },
  mainContentWrapper: { // App.js의 .main-content가 이 역할을 하므로, 여기서는 불필요하거나 내부 패딩만 정의
    // flexGrow: 1,
    // display: 'flex',
    // flexDirection: 'column',
    // height: '100vh',
    // overflow: 'hidden',
  },
  mainHeader: {
    padding: '20px',
    borderBottom: '1px solid #ccc',
    backgroundColor: 'var(--card-bg, white)',
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
 headerActions: { // 기존 스타일 유지 또는 필요시 조정
    display: 'flex',
    alignItems: 'center',
    gap: '20px', // 아이콘 간 간격
  },



  pageContentArea: {
    flexGrow: 1,
    padding: '20px',
    backgroundColor: 'var(--main-bg, #f4f6f8)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  // ... 나머지 스타일 객체는 기존과 유사하게 유지 ...
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '15px',
    marginBottom: '15px',
    flexShrink: 0,
  },
  bottomChartsRow: {
    display: 'flex',
    gap: '15px',
    flexGrow: 1,
    minHeight: 0,
  },
  leftLargeChartContainer: {
    flex: '1 1 0%',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  rightColumnContainer: {
    flex: '1 1 0%',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    minWidth: 0,
  },
};

// --- 모든 차트 데이터 및 옵션 정의 (기존과 동일) ---
const aqiChartData = { labels: ['AQI 값', '나머지'], datasets: [ { label: '현재 종합 공기질', data: [59, 100 - 59], backgroundColor: ['#FFCE56', '#E0E0E0'], borderColor: ['#FFCE56', '#E0E0E0'], borderWidth: 1, circumference: 180, rotation: 270, }, ], };
const aqiChartOptions = { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: false } } };
const doughnutTextPlugin = { id: 'doughnutText', afterDraw(chart, args, options) { const { ctx, chartArea: { top, width, height } } = chart; ctx.save(); const text = options.text || 'N/A'; const value = options.value || ''; ctx.font = `bold ${height / 5}px sans-serif`; ctx.fillStyle = options.valueColor || '#000'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(value, width / 2, height / 1.8 + top); ctx.restore(); ctx.font = `${height / 12}px sans-serif`; ctx.fillStyle = options.textColor || '#666'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, width / 2, height / 1.8 + top + (height / 5) * 0.8); ctx.restore(); } };
const smallLineChartOptions = { responsive: true, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } }, plugins: { legend: { display: false }, tooltip: { enabled: false } }, elements: { line: { tension: 0.4, borderWidth: 2 }, point: { radius: 0 } }, };
const pm25LineData = { labels: ['1', '2', '3', '4', '5', '6', '7'], datasets: [{ label: 'PM2.5', data: [15, 18, 17, 20, 18.8, 19, 18], borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.2)', fill: true }], };
const pm10LineData = { labels: ['1', '2', '3', '4', '5', '6', '7'], datasets: [{ label: 'PM1.0', data: [25, 22, 26, 24, 27.5, 25, 28], borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.2)', fill: true }], };
const tempLineData = { labels: ['1', '2', '3', '4', '5', '6', '7'], datasets: [{ label: '온도', data: [25, 25.5, 26, 25.8, 25.9, 26.2, 25.7], borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: true }], };
const humidityLineData = { labels: ['1', '2', '3', '4', '5', '6', '7'], datasets: [{ label: '습도', data: [30, 32, 35, 33, 36, 34, 37], borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: true }], };
const timeSeriesChartData = { labels: ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'], datasets: [ { label: '초미세먼지 (PM2.5)', data: [10, 12, 15, 20, 22, 18, 16, 17, 25, 30, 32, 28, 26, 24, 22, 28, 35, 40, 38, 30, 25, 20, 18, 15], borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.1)', fill: true, tension: 0.4, pointRadius: 2, pointBackgroundColor: 'rgb(54, 162, 235)' }, { label: '미세먼지 (PM1.0)', data: [15, 18, 22, 28, 30, 25, 22, 24, 33, 38, 40, 35, 33, 30, 28, 35, 45, 50, 48, 38, 32, 28, 25, 20], borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.1)', fill: true, tension: 0.4, pointRadius: 2, pointBackgroundColor: 'rgb(255, 159, 64)' } ] };
const timeSeriesChartOptions = { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 12, autoSkipPadding: 20 } }, y: { beginAtZero: true, grid: { color: '#e0e0e0' }, ticks: { padding: 10 } } }, plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 12, padding: 20 } }, tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(0,0,0,0.7)', titleFont: { size: 14 }, bodyFont: { size: 12 }, padding: 10 } }, interaction: { mode: 'index', intersect: false },  layout: {
    padding: {
      // top: 0, left: 0, right: 0, // 필요하다면 다른 쪽 패딩도 설정
      bottom: 20 // 예시 값입니다. 0, 5, 10 등으로 설정하며 "일별 환경 지표 요약" 차트와 비슷해질 때까지 조절합니다.
                 // 이 값을 줄이면 X축 아래의 빈 공간이 줄어듭니다.
    }
  } };
const dailyAverageChartData = { labels: ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', 'D-0 (오늘)'], datasets: [ { label: 'PM2.5 평균', data: [22, 25, 23, 28, 26, 30, 27], backgroundColor: 'rgba(54, 162, 235, 0.6)', borderColor: 'rgb(54, 162, 235)', borderWidth: 1, barPercentage: 0.6, categoryPercentage: 0.7 }, { label: 'PM1.0 평균', data: [30, 33, 31, 36, 34, 38, 35], backgroundColor: 'rgba(255, 159, 64, 0.6)', borderColor: 'rgb(255, 159, 64)', borderWidth: 1, barPercentage: 0.6, categoryPercentage: 0.7 } ] };
const dailyAverageChartOptions = { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#e0e0e0' }, ticks: { padding: 10 } } }, plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 12, padding: 20 } }, tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(0,0,0,0.7)' } }
  };


// DashboardPage는 App.js로부터 userRole을 받을 수 있습니다. (현재 코드에서는 직접 사용하지 않음)
function DashboardPage({ userRole }) {
  const aqiDoughnutOptionsWithText = {
    ...aqiChartOptions,
    plugins: {
      ...aqiChartOptions.plugins,
      doughnutText: { text: '보통', value: '59', valueColor: '#FFCE56', textColor: '#666' }
    }
  };

 // 알림 관련 상태 추가
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, time: '11:30 AM', message: '공조 장치 #FAN-001이(가) 수동으로 꺼졌습니다.', type: 'warning' },
    { id: 2, time: '11:32 AM', message: '사무실 B 에어컨이 가동되었습니다.', type: 'info' },
    { id: 3, time: '11:50 AM', message: '클린룸 A-1 구역 PM2.5 수치 정상화 완료.', type: 'success' },
    { id: 4, time: '12:05 PM', message: '서버실 온도 센서 응답 없음. 확인 필요.', type: 'error' },
  ]);
  const notificationPanelRef = useRef(null); // 알림 패널 DOM 참조

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };

  // 외부 클릭 시 알림 패널 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target)) {
        // 클릭된 요소가 알림 아이콘(.notification-bell)인지 확인
        if (!event.target.closest('.notification-bell')) {
          setShowNotifications(false);
        }
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);










  // activeMenu 상태와 setActiveMenu 함수는 DashboardPage 내부에서 더 이상 필요하지 않거나,
  // 다른 방식으로 관리되어야 합니다. (예: 현재 라우트 정보를 사용)
  // 여기서는 일단 해당 상태 및 관련 로직을 제거하거나 단순화합니다.

  return (
    // 최상위 div의 style={styles.dashboardContainer} 등은 App.css 또는 App.js의 레이아웃과 중복될 수 있으므로 제거하거나 단순화
    // className="dashboard-page" 와 같이 페이지별 클래스명을 부여하는 것을 고려
    <div className="dashboard-page-content"> {/* App.js의 .main-content 하위에 위치 */}
      <header style={styles.mainHeader} className="main-header">
        <div className="header-title-section">
          {/* 페이지 제목을 고정하거나, 라우트 기반으로 변경 */}
          <h2>공장 공기질 요약</h2>
        </div>
        <div style={styles.headerActions}className="header-actions">
          <div className="notification-area">
        <button onClick={toggleNotifications} className="notification-bell">
              <i className="fas fa-bell"></i>
              {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
            </button>
            {showNotifications && (
              <div ref={notificationPanelRef} className="notification-panel">
                <div className="notification-panel-header">
                  <h4>알림 목록</h4>
                </div>
                {notifications.length > 0 ? (
                  <ul>
                    {notifications.map(notif => (
                      <li key={notif.id} className={`notification-item type-${notif.type}`}>
                        <span className="notification-time">{notif.time}</span>
                        <p className="notification-message">{notif.message}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-notifications">새로운 알림이 없습니다.</p>
                )}
                </div>
            )}
          </div>
        </div>
      </header>

      {/* main-content-wrapper 와 content-area 클래스 역할은 App.js의 main-content 및 이 div로 통합 */}
      <main style={styles.pageContentArea} className="page-actual-content">
        {/* 대시보드 고정 내용만 표시 */}
        <>
          <div style={styles.dashboardGrid} className="dashboard-grid">
            <DataCard title="현재 종합 공기질 (AQI)" ChartComponent={Doughnut} chartData={aqiChartData} chartOptions={aqiDoughnutOptionsWithText} chartPlugins={[doughnutTextPlugin]} isAQI={true} />
            <DataCard title="초미세먼지 (PM2.5)" value="18.8" unit="µg/m³" ChartComponent={Line} chartData={pm25LineData} chartOptions={smallLineChartOptions} />
            <DataCard title="미세먼지 (PM10)" value="27.5" unit="µg/m³" ChartComponent={Line} chartData={pm10LineData} chartOptions={smallLineChartOptions} />
            <DataCard title="온도" value="25.9" unit="°C" ChartComponent={Line} chartData={tempLineData} chartOptions={smallLineChartOptions} />
            <DataCard title="습도" value="36" unit="%" ChartComponent={Line} chartData={humidityLineData} chartOptions={smallLineChartOptions} />
          </div>

          <div style={styles.bottomChartsRow}>
            <div style={styles.leftLargeChartContainer} className="air-quality-trend-card">
              <TimeSeriesChartCard
                title="시간별 미세먼지 변화 (PM2.5, PM10)"
                chartData={timeSeriesChartData}
                chartOptions={timeSeriesChartOptions}
              />
            </div>
            <div style={styles.rightColumnContainer}>
              <div className="daily-air-quality-summary-card">
                <DailyAverageChartCard
                  title="일별 환경 지표 요약"
                  chartData={dailyAverageChartData}
                  chartOptions={dailyAverageChartOptions}
                />
              </div>

            </div>
          </div>
        </>
        {/* // '장치 관리' 관련 내용은 별도의 DeviceManagementPage 컴포넌트 및 라우트로 분리하는 것을 권장합니다.
          // 만약 DashboardPage 내에서 조건부 렌더링이 필요하다면, userRole prop을 활용할 수 있습니다.
          {userRole === 'admin' && (
             <div><p>관리자용 추가 대시보드 정보</p></div>
          )}
        */}
      </main>
    </div>
  );
}

export default DashboardPage;