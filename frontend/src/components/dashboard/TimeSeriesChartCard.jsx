// src/components/dashboard/TimeSeriesChartCard.js
import React from 'react';
import { Line } from 'react-chartjs-2';

// 스타일 객체
const styles = {
  largeChartCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    marginBottom: '20px',
    // 이 카드가 부모 flex 컨테이너의 높이를 100% 채우도록 하려면 추가 스타일 필요 가능성
    // 예: display: 'flex', flexDirection: 'column', height: '100%'
    // 하지만 현재는 chartWrapper의 고정 높이로 제어합니다.
  },
  chartTitle: {
    marginBottom: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  chartWrapper: {
    height: '240px', // ⭐ 기존 '300px'에서 '250px'로 수정하여 DailyAverageChartCard와 동일하게 맞춤
    // 이 높이는 차트가 그려지는 <div>의 높이입니다.
    // 차트 옵션에서 maintainAspectRatio: false 로 설정되어 있다면, 캔버스는 이 높이에 맞춰집니다.
  }
};

function TimeSeriesChartCard({ title, chartData, chartOptions }) {
  // 차트 옵션에 maintainAspectRatio: false가 설정되어 있는지 확인하면 좋습니다.
  // 예: const options = { ...chartOptions, maintainAspectRatio: false };
  //    <Line data={chartData} options={options} />
  // 만약 이미 chartOptions에 해당 설정이 있다면 그대로 사용합니다.

  return (
    <div style={styles.largeChartCard}>
      {title && <h3 style={styles.chartTitle}>{title}</h3>}
      <div style={styles.chartWrapper}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

export default TimeSeriesChartCard;

