// src/pages/AnomalyHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import './AnomalyHistoryPage.css'; // 페이지별 CSS 로드 (App.css에 관련 스타일이 있다면 생략 가능)
// import { fetchAnomalyHistoryAPI } from '../apiService';

const mockAnomalyHistoryData = [
  { a_idx: 1, a_date: '2025-05-20T10:00:00Z', device_identifier: '서버랙 1 온도 센서', a_type: '온도 이상', a_message: '서버실 온도가 설정된 임계치(30°C)를 초과했습니다. 현재 온도: 32°C.', status_처리상태: '확인 필요', is_read: false },

];

const formatDisplayDateTime = (isoString) => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\. /g, '.').replace(/\.오전/, '오전').replace(/\.오후/, '오후');
  } catch (e) { return isoString; }
};

const AnomalyHistoryPage = ({ currentUser }) => { // currentUser prop 추가 (필요시)
  const [anomalies, setAnomalies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);




  useEffect(() => {
    const loadAnomalyHistory = async () => {
      setIsLoading(true);
      try {///////////////////////////////////////////////////////////////////////////////////////////////////////////////
        const response = await fetch("http://localhost:8000/api/alert/anomalies");
        if (!response.ok) throw new Error("API 요청 실패");
        const data = await response.json();
        const formattedData = data.map(item => ({
          ...item,
          display_a_date: formatDisplayDateTime(item.a_date),
          status_처리상태: item.is_read ? "조치 완료" : "확인 필요",
          device_identifier: item.he_name
        }));
        setAnomalies(formattedData);
      } catch (err) {
        setError("이상 이력 정보를 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnomalyHistory();
  }, []);


  if (isLoading) return <div className="loading-message" style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>;
  if (error) return <div className="error-message" style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div className="page-anomaly-history">
      <header className="main-header">
        <div className="header-title-section">
          <h2>이상 탐지 이력</h2>
        </div>
        {/* 필터링 UI 추가 공간 */}
      </header>
      <main className="content-area">
        <div className="list-container"> {/* App.css에 스타일 정의 (.device-list-container 스타일 재활용 가능) */}
          {anomalies.length > 0 ? (
            <table className="data-table anomaly-history-table"> {/* App.css에 스타일 정의 */}
              <thead>
                <tr>
                  <th>발생 시각 </th>
                  <th>관련 장치/위치 </th>
                  <th>유형 </th>
                  <th>상세 내용 </th>
                  <th>조치 상태 </th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map(anomaly => (
                  <tr key={anomaly.a_idx} className={!anomaly.is_read ? 'unread-anomaly' : ''}>
                    <td>{anomaly.display_a_date}</td>
                    <td>{anomaly.device_identifier || '-'}</td>
                    <td>{anomaly.a_type}</td>
                    <td style={{ maxWidth: '400px', whiteSpace: 'normal', wordBreak: 'break-all' }}>
                      {anomaly.a_message}
                    </td>
                    <td>
                      <span className={`status-badge status-${String(anomaly.status_처리상태).replace(/\s+/g, '-').toLowerCase()}`}>
                        {anomaly.status_처리상태}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data-message">표시할 이상 탐지 이력이 없습니다.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnomalyHistoryPage;