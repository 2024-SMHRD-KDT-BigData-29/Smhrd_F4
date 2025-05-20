// src/pages/AnomalyHistoryPage.js
import React, { useState, useEffect } from 'react';
import './AnomalyHistoryPage.css'; // 곧 생성할 CSS 파일

// 가짜 데이터 (나중에 API에서 가져오도록 변경)
const mockAnomalies = [
  { id: 1, timestamp: '2025-05-19 10:00:00', device: '서버랙 1 온도 센서', type: '온도 이상', description: '서버실 온도가 설정된 임계치(30°C)를 초과했습니다. 현재 온도: 32°C.', status: '확인 필요' },
  { id: 2, timestamp: '2025-05-19 09:15:00', device: '메인 출입문 센서', type: '비인가 접근 시도', description: '메인 출입문에서 승인되지 않은 카드키 접근이 감지되었습니다.', status: '조치 완료' },
  { id: 3, timestamp: '2025-05-18 17:30:00', device: 'UPS 전원 공급 장치', type: '전원 불안정', description: 'UPS 입력 전원이 불안정한 상태입니다. 배터리 모드로 전환되었습니다.', status: '확인 중' },
  { id: 4, timestamp: '2025-05-18 11:05:00', device: '네트워크 스위치 3', type: '연결 끊김', description: '3번 네트워크 스위치 포트 5에서 연결이 끊겼습니다.', status: '조치 완료' },
  { id: 5, timestamp: '2025-05-17 22:10:00', device: 'CCTV 카메라 5', type: '오프라인', description: '로비 CCTV 카메라 5가 오프라인 상태입니다. 네트워크 연결 확인 필요.', status: '확인 필요' },
];

const AnomalyHistoryPage = () => {
  const [anomalies, setAnomalies] = useState([]);
  // 추후 필터링/정렬을 위한 상태 추가 가능
  // const [filter, setFilter] = useState('');

  useEffect(() => {
    // 컴포넌트 마운트 시 가짜 데이터 로드
    // 추후 이 부분에서 API 호출로 데이터를 가져올 수 있습니다.
    setAnomalies(mockAnomalies);
  }, []);

  return (
    <div className="anomaly-history-page">
      <header className="page-header">
        <h1>이상 탐지 이력</h1>
        {/* 필요하다면 여기에 필터링 UI 추가 */}
      </header>
      <div className="page-content">
        {anomalies && anomalies.length > 0 ? (
          <table className="anomaly-table">
            <thead>
              <tr>
                <th>발생 시각</th>
                <th>장치</th>
                <th>유형</th>
                <th>상세 내용</th>
                <th>조치 상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map(anomaly => (
                <tr key={anomaly.id}>
                  <td>{anomaly.timestamp}</td>
                  <td>{anomaly.device}</td>
                  <td>{anomaly.type}</td>
                  <td>{anomaly.description}</td>
                  <td>
                    <span className={`status-badge status-${anomaly.status.replace(' ', '-').toLowerCase()}`}>
                      {anomaly.status}
                    </span>
                  </td>
                  <td>
                    <button className="action-button">상세 보기</button>
                    {/* <button className="action-button">조치 입력</button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>표시할 이상 탐지 이력이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default AnomalyHistoryPage;