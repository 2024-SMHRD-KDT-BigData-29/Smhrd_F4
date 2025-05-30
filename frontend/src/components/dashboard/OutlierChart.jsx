import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// 기대하는 데이터 예시: [{ date: '2025-05-26', count: 3 }, ...]
const OutlierChart = ({ data }) => {
  return (
    <div className="outlier-chart" style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#e74c3c" name="이상치 개수" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OutlierChart;
