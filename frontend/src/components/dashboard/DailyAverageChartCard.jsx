// src/components/dashboard/DailyAverageChartCard.js
import React from 'react';
import { Bar } from 'react-chartjs-2';

// 스타일 객체 (DashboardPage.js의 chartCard 스타일과 유사하게)
const styles = {
  chartCard: { // DataCard와 유사한 기본 카드 스타일
    backgroundColor: 'white',
    padding: '20px', // DataCard와 통일
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    flex: 1, // 부모가 flex 컨테이너일 때 비율대로 늘어남
    minWidth: '300px', // 최소 너비
    paddingBottom: '10px', // 차트 하단 여백을 위해
    marginBottom: '7px',
  },
  chartTitle: {
    marginBottom: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  chartWrapper: {
    height: '250px', // 차트 높이
  }
};

function DailyAverageChartCard({ title, chartData, chartOptions }) {
  return (
    <div style={styles.chartCard}>
      {title && <h3 style={styles.chartTitle}>{title}</h3>}
      <div style={styles.chartWrapper}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

export default DailyAverageChartCard;