import React, { useState } from 'react';
import axios from 'axios';
import SummaryCard from '../components/dashboard/SummaryCard';
import OutlierChart from '../components/dashboard/OutlierChart';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const IsolationForestPage = () => {
  const [summary, setSummary] = useState(null);
  const [outlierData, setOutlierData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/data_analysis/summary`);
      setSummary(response.data);
      setError(null);
    } catch (err) {
      console.error('요약 데이터 로딩 실패:', err);
      setError('데이터 가져오기 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/data_analysis/outliers-by-day`);
      setOutlierData(response.data);
      setError(null);
    } catch (err) {
      console.error('이상치 통계 조회 실패:', err);
      setError('이상치 분석 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-isolation-forest" style={{ padding: '30px' }}>
      <h2>환경 데이터 이상치 분석</h2>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleFetchData} style={{ marginRight: '10px' }}>📥 데이터 가져오기</button>
        <button onClick={handleTrainModel}>🤖 학습하기</button>
      </div>

      {loading && <p>불러오는 중...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {summary && (
        <div className="summary-cards" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
          <SummaryCard title="온습도 데이터 수" value={summary.temperature_data_count} unit="건" />
          <SummaryCard title="평균 온도" value={summary.avg_temp} unit="°C" />
          <SummaryCard title="평균 습도" value={summary.avg_humidity} unit="%" />
          <SummaryCard title="미세먼지 데이터 수" value={summary.pm_data_count} unit="건" />
          <SummaryCard title="평균 PM10" value={summary.avg_pm10} unit="㎍/m³" />
          <SummaryCard title="평균 PM2.5" value={summary.avg_pm25} unit="㎍/m³" />
        </div>
      )}

      {outlierData.length > 0 && (
        <div style={{ display: 'flex', gap: '40px' }}>
          <div style={{ flex: 1 }}>
            <h3>📊 일별 이상치 시각화</h3>
            <OutlierChart data={outlierData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default IsolationForestPage;