// src/pages/PowerHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './PowerHistoryPage.css';

const formatDisplayDateTime = (isoString) => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).replace(/\. /g, '.');
  } catch {
    return isoString;
  }
};

const PowerHistoryPage = ({ currentUser }) => {
  const [powerData, setPowerData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [hvacList, setHvacList] = useState([]);
  const [selectedHeIdx, setSelectedHeIdx] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHvacList = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/hvac/");
        const data = await res.json();
        const active = data.filter(d => d.he_power === true);
        setHvacList(active);
        if (active.length > 0) setSelectedHeIdx(active[0].he_idx);
      } catch (err) {
        console.error(err);
      }
    };
    loadHvacList();
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!selectedHeIdx) return;
      try {
        const res = await fetch(`http://localhost:8000/api/power/all_data?he_idx=${selectedHeIdx}`);
        if (!res.ok) throw new Error("API 요청 실패");
        const data = await res.json();
        setPowerData(data.map(item => ({
          ...item,
          display_time: formatDisplayDateTime(item.timestamp)
        })));
      } catch (err) {
        console.error(err);
        setError("전력 데이터를 불러오는 데 실패했습니다.");
      }
    };
    fetchAllData();
  }, [selectedHeIdx]);

  useEffect(() => {
    const fetchFilteredData = async () => {
      if (!selectedHeIdx || !selectedDate) return;
      try {
        const res = await fetch(`http://localhost:8000/api/power/by_date?he_idx=${selectedHeIdx}&date=${selectedDate}`);
        if (!res.ok) throw new Error("필터 API 실패");
        const data = await res.json();

        const formatted = data.map(item => ({
          ...item,
          display_time: formatDisplayDateTime(item.timestamp)
        }));
        setFilteredData(formatted);
      } catch (err) {
        console.error(err);
        setError("날짜 기준 데이터를 불러오는 데 실패했습니다.");
      }
    };
    fetchFilteredData();
  }, [selectedDate, selectedHeIdx]);

  const handleDeviceChange = (e) => {
    const selected = parseInt(e.target.value, 10);
    const selectedDevice = hvacList.find(d => d.he_idx === selected);
    if (selectedDevice && selectedDevice.he_power === true) {
      setSelectedHeIdx(selected);
    } else {
      alert("전원이 꺼진 장비입니다.");
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className="power-history-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>전력 소비 이력</h1>
          <label>
            장비 선택:
            <select value={selectedHeIdx || ''} onChange={handleDeviceChange} style={{ marginLeft: '8px' }}>
              {hvacList.map(item => (
                <option key={item.he_idx} value={item.he_idx}>{item.he_name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="header-date-picker">
          <label>
            날짜 선택:
            <input type="date" value={selectedDate} onChange={handleDateChange} />
          </label>
        </div>
      </div>

      <div className="page-content">
        <div className="left-panel">
          <h3>전체 전력 소비 이력</h3>
          <div className="data-table-container">
            <table className="power-table">
              <thead>
                <tr>
                  <th>측정 시각</th>
                  <th>소비 전력 (W)</th>
                </tr>
              </thead>
              <tbody>
                {powerData.length > 0 ? powerData.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.display_time}</td>
                    <td>{item.wattage?.toFixed(2) ?? '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="2">데이터 없음</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="right-panel">
          <div className="chart-wrapper">
            {filteredData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="display_time" tick={{ fontSize: 10 }} interval={Math.floor(filteredData.length / 5)} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="wattage" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', marginTop: '50px', color: '#888' }}>
                해당 날짜의 데이터가 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerHistoryPage;
