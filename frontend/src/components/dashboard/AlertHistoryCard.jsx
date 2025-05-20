// src/components/dashboard/AlertHistoryCard.js
import React from 'react';

// 스타일 객체 (DashboardPage.js의 alertHistoryCard 스타일과 유사하게)
const styles = {
  alertHistoryCard: {
    backgroundColor: 'white',
    padding: '20px', // 다른 카드들과 패딩 일관성 유지
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    flex: 1,
    minWidth: '300px',
  },
  cardTitle: {
    marginBottom: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    listStyle: 'none',
    paddingLeft: 0,
    fontSize: '14px',
    lineHeight: '1.8',
  },
  listItemTime: {
    color: '#888',
    marginRight: '10px',
  }
};

// 가짜 이력 데이터 (나중에는 props로 받거나 API 호출)
const dummyAlerts = [
  { time: '2025-05-14 10:53:', message: '클린룸 A-1 PM1.0 농도 급상승' },
  { time: '2025-05-14 09:30:', message: '메인 공정라인 온도 설정치 초과' },
  { time: '2025-05-13 17:45:', message: 'FAB-2 습도 비정상 감지' },
];

function AlertHistoryCard({ title, alerts = dummyAlerts }) { // alerts prop 기본값으로 더미 데이터 사용
  return (
    <div style={styles.alertHistoryCard}>
      {title && <h3 style={styles.cardTitle}>{title}</h3>}
      <ul style={styles.list}>
        {alerts.map((alert, index) => (
          <li key={index}>
            <span style={styles.listItemTime}>{alert.time}</span>
            {alert.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AlertHistoryCard;