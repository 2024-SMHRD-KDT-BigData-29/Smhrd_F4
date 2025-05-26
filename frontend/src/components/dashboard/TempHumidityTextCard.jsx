// src/components/dashboard/TempHumidityTextCard.jsx (새 파일)
import React from 'react';

// 이 컴포넌트는 DataCard.jsx 와 유사한 카드 스타일을 사용할 수 있도록
// className="card" 를 최상위 div에 부여합니다.
// 필요하다면 DataCard.jsx 내부의 카드 헤더/바디 구조를 참고하여 일관성을 유지할 수 있습니다.

const TempHumidityTextCard = ({ temp, humidity }) => {
  return (
    <div className="card temp-humidity-text-card"> {/* 공통 카드 스타일 및 식별용 클래스 */}
      <div className="card-header">
        <h3>
          <i className="fas fa-thermometer-half card-icon-title" style={{ marginRight: '10px' }}></i>
          현재 온습도
        </h3>
        {/* 추가적인 메뉴나 필터가 필요하면 여기에 추가 */}
      </div>
      <div className="card-body">
        {/* 온도와 습도 값을 표시하는 부분 */}
        <div className="temp-humidity-display">
          <div className="metric">
            <span className="metric-label">온도:</span>
            <span className="metric-value">{temp?.toFixed(1) ?? 'N/A'} °C</span>
          </div>
          <div className="metric">
            <span className="metric-label">습도:</span>
            <span className="metric-value">{humidity?.toFixed(0) ?? 'N/A'} %</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TempHumidityTextCard;