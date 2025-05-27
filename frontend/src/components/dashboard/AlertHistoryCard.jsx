// src/components/dashboard/AlertHistoryCard.jsx
import React from 'react';
import './AlertHistoryCard.css'; // ✅ css 연결



const styles = {
  alertHistoryCard: {
    backgroundColor: 'white',
    padding: '20px',
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

function AlertHistoryCard({ title, alerts, onConfirm }) {
  return (
    <div style={styles.alertHistoryCard}>
      {title && <h3 style={styles.cardTitle}>{title}</h3>}
      <ul style={styles.list}>
        {alerts.length === 0 ? (
          <li>최근 알림이 없습니다.</li>
        ) : (
          alerts.map((alert) => (
            <li key={alert.a_idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={styles.listItemTime}>
                  {new Date(alert.a_date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span>
                  <strong>{alert.he_name}</strong>에서 {alert.a_type} 발생
                </span>
              </div>
              {!alert.is_read && (
                <button onClick={() => onConfirm(alert.a_idx)} style={{ fontSize: '12px', marginLeft: '10px' }}>
                  확인
                </button>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default AlertHistoryCard;
