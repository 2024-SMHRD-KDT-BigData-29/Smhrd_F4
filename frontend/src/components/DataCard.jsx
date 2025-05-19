// src/components/dashboard/DataCard.js

import React from 'react';

// 스타일 객체 (DashboardPage.js의 chartCard 관련 스타일과 유사하게)
const styles = {
  chartCard: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '180px', // 카드의 최소 높이를 주어 정렬을 돕습니다.
  },
  chartCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  chartCardTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  },
  chartCardValueUnitContainer: { // 값과 단위를 묶는 컨테이너
    display: 'flex',
    alignItems: 'baseline', // 값과 단위의 baseline 정렬
  },
  chartCardValue: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#555',
  },
  chartCardUnit: { // 단위 스타일
    fontSize: '14px',
    color: '#777',
    marginLeft: '4px',
  },
  chartWrapperSmall: {
    height: '80px', // 기본 작은 차트 높이, AQI는 다를 수 있음
    marginTop: 'auto', // 차트를 카드 하단에 위치
    width: '100%', // 너비 100%
  },
  aqiChartWrapper: { // AQI 도넛 차트용 래퍼 (높이 조절)
    position: 'relative',
    height: '150px',
    marginTop: 'auto',
    width: '100%',
  }
};

function DataCard({ title, value, unit, ChartComponent, chartData, chartOptions, chartPlugins, isAQI = false }) {
  return (
    <div style={styles.chartCard}>
      <div style={styles.chartCardHeader}>
        <span style={styles.chartCardTitle}>{title}</span>
        {value && ( // value가 있을 때만 값과 단위를 표시
          <div style={styles.chartCardValueUnitContainer}>
            <span style={styles.chartCardValue}>{value}</span>
            {unit && <span style={styles.chartCardUnit}>{unit}</span>}
          </div>
        )}
      </div>
      {ChartComponent && chartData && chartOptions && (
        <div style={isAQI ? styles.aqiChartWrapper : styles.chartWrapperSmall}>
          <ChartComponent data={chartData} options={chartOptions} plugins={chartPlugins || []} />
        </div>
      )}
    </div>
  );
}

export default DataCard;