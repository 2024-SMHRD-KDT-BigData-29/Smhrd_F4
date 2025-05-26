// src/components/dashboard/ComfortStatusCard.jsx (새 파일)
import React from 'react';

const ComfortStatusCard = ({ status }) => {
  let statusColor = 'var(--text-primary)'; // 기본 텍스트 색상
  let iconClass = 'fas fa-question-circle'; // 기본 아이콘

  if (status === '쾌적') {
    statusColor = 'var(--aqi-good)'; // "좋음" 상태의 녹색 사용
    iconClass = 'fas fa-smile'; // 쾌적 아이콘
  } else if (status === '혼잡') {
    statusColor = 'var(--aqi-unhealthy-sensitive)'; // "민감군주의" (주황색 계열) 사용
    iconClass = 'fas fa-meh'; // 혼잡(불쾌) 아이콘
  } else if (status === '데이터 부족' || status === '오류') {
    statusColor = 'var(--text-secondary)';
    iconClass = 'fas fa-exclamation-triangle';
  }


  return (
    <div className="card comfort-status-card">
      <div className="card-header">
        <h3>
          <i className="fas fa-leaf card-icon-title" style={{ marginRight: '10px' }}></i>
         현재 쾌적 지수
        </h3>
      </div>
      <div className="card-body" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <i className={iconClass} style={{ fontSize: '2.5em', color: statusColor, marginBottom: '10px' }}></i>
        <p className="comfort-status-text" style={{ fontSize: '1.5em', fontWeight: '600', color: statusColor, margin: 0 }}>
          {status}
        </p>
      </div>
    </div>
  );
};

export default ComfortStatusCard;