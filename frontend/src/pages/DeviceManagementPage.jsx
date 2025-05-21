// src/pages/DeviceManagementPage.jsx
import React, { useState, useEffect } from 'react';
import {
  fetchDevicesAPI,
  addDeviceAPI,
  updateDeviceAPI,
  deleteDeviceAPI,
  fetchHvacEquipmentsAPI,
  controlHvacAPI
} from '../apiService'; // ⭐ 실제 API 서비스 import (경로 확인!)

// DeviceModal 컴포넌트는 이전과 동일하게 유지 (내부 로직 변경 없음)
const DeviceModal = ({ show, onClose, onSave, deviceData, setDeviceData, modalTitle }) => {
  if (!show) { return null; }
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDeviceData(prev => ({ ...prev, [name]: value }));
  };
  return (
    <div className={`modal ${show ? 'show' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h3 id="modalTitle">{modalTitle}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <form id="deviceForm">
            <div className="form-group">
              <label htmlFor="eb_idx_input">장치 ID (eb_idx):</label>
              <input type="text" id="eb_idx_input" name="eb_idx" placeholder="고유 ID 입력 (예: FAB1-RPi-001)" value={deviceData.eb_idx || ''} onChange={handleChange} required disabled={modalTitle !== "새 장치 추가"} />
            </div>
            <div className="form-group">
              <label htmlFor="eb_name_input">장치명 (eb_name):</label>
              <input type="text" id="eb_name_input" name="eb_name" placeholder="Raspberry Pi 모델 및 센서 정보" value={deviceData.eb_name || ''} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="eb_loc_input">설치 위치 (eb_loc):</label>
              <input type="text" id="eb_loc_input" name="eb_loc" placeholder="공장 내 상세 위치" value={deviceData.eb_loc || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="eb_serial_num_input">시리얼 번호 (eb_serial_num):</label>
              <input type="text" id="eb_serial_num_input" name="eb_serial_num" placeholder="장치 시리얼 번호" value={deviceData.eb_serial_num || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="install_date_input">설치 날짜 (install_date):</label>
              <input type="date" id="install_date_input" name="install_date" value={deviceData.install_date || ''} onChange={handleChange} />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button onClick={onSave} className="action-btn primary-btn">저장</button>
          <button onClick={onClose} className="action-btn">취소</button>
        </div>
      </div>
    </div>
  );
};


const DeviceManagementPage = ({ currentUser }) => {
  const [devices, setDevices] = useState([]);
  const [hvacEquipments, setHvacEquipments] = useState([]);

  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [currentDeviceData, setCurrentDeviceData] = useState({
    eb_idx: '', eb_name: '', eb_loc: '', install_date: '', eb_serial_num: '', m_id: ''
  });
  const [deviceModalTitle, setDeviceModalTitle] = useState("새 장치 추가");

  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [devicesError, setDevicesError] = useState(null);
  const [isLoadingHvac, setIsLoadingHvac] = useState(false);
  const [hvacError, setHvacError] = useState(null);

  // 데이터 로드 함수
  const loadDevices = async () => {
    setIsLoadingDevices(true);
    setDevicesError(null);
    try {
      const response = await fetchDevicesAPI();
      // API 명세서에 따르면 응답이 [{ eb_idx: ..., eb_name: ..., ... }] 형태
      // 만약 API 응답이 { "status": "ok", "data": [...] } 형태라면 response.data.data 사용
      setDevices(response.data || []);
    } catch (error) {
      console.error("Error fetching devices:", error.response || error);
      setDevicesError("측정 장치 목록을 불러오는 데 실패했습니다.");
      setDevices([]); // 에러 발생 시 빈 배열로
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const loadHvacEquipments = async () => {
    setIsLoadingHvac(true);
    setHvacError(null);
    try {
      const response = await fetchHvacEquipmentsAPI(); // 이 API는 명세에 없으므로, 구현 필요
      // 응답 형식을 { "status": "ok", "data": [...] } 또는 [...] 로 가정
      setHvacEquipments(response.data || []);
    } catch (error) {
      console.error("Error fetching HVAC equipments:", error.response || error);
      setHvacError("공조 설비 목록을 불러오는 데 실패했습니다.");
      setHvacEquipments([]); // 에러 발생 시 빈 배열로
    } finally {
      setIsLoadingHvac(false);
    }
  };

  useEffect(() => {
    loadDevices();
    loadHvacEquipments();
  }, []);

  // --- 측정 장치 핸들러 ---
  const handleAddDevice = () => {
    setCurrentDeviceData({
      eb_idx: '', eb_name: '', eb_loc: '', install_date: '', eb_serial_num: '',
      m_id: currentUser?.m_id || '' // 로그인한 사용자 m_id (API 명세 확인하여 필요한 필드만 전송)
    });
    setDeviceModalTitle("새 장치 추가");
    setShowDeviceModal(true);
  };

  const handleEditDevice = (device) => {
    setCurrentDeviceData(device); // device 객체는 API 응답 형식과 일치
    setDeviceModalTitle("장치 정보 수정");
    setShowDeviceModal(true);
  };

  const handleDeleteDevice = async (eb_idx) => {
    if (window.confirm(`정말로 장치 ID '${eb_idx}'를 삭제하시겠습니까?`)) {
      setIsLoadingDevices(true); // 특정 장치에 대한 로딩 상태 관리가 더 좋을 수 있음
      try {
        await deleteDeviceAPI(eb_idx); // API 호출
        setDevices(prevDevices => prevDevices.filter(device => device.eb_idx !== eb_idx));
        console.log("삭제된 장치 ID (eb_idx):", eb_idx);
        alert(`장치 ID '${eb_idx}'가 삭제되었습니다.`);
      } catch (error) {
        console.error("Error deleting device:", error.response || error);
        alert(`장치 삭제 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
      } finally {
        setIsLoadingDevices(false);
      }
    }
  };

  const handleSaveDevice = async () => {
    // API로 보낼 payload (API 명세에 따라 실제 필요한 필드만 포함시켜야 함)
    // 예를 들어, eb_idx, eb_name, eb_loc, eb_serial_num, install_date, m_id 등
    const payload = { ...currentDeviceData };
    if (currentUser && currentUser.m_id && !payload.m_id) {
        payload.m_id = currentUser.m_id;
    }
    // install_date 형식 변환 (API가 YYYY-MM-DDTHH:mm:ss를 요구한다면)
    if (payload.install_date && payload.install_date.length === 10) { // YYYY-MM-DD 형식인지 체크
        payload.install_date = `${payload.install_date}T00:00:00`;
    }


    setIsLoadingDevices(true);
    try {
      if (deviceModalTitle === "새 장치 추가") {
        if (!payload.eb_idx) {
          alert("장치 ID (eb_idx)를 입력해주세요.");
          setIsLoadingDevices(false);
          return;
        }
        const response = await addDeviceAPI(payload);
        setDevices(prevDevices => [...prevDevices, response.data]); // 성공 시 응답받은 객체로 추가
        loadDevices(); // 또는 목록을 다시 불러옴
        alert("새 장치가 성공적으로 추가되었습니다.");
      } else { // 수정
        const response = await updateDeviceAPI(payload.eb_idx, payload);
        setDevices(prevDevices => prevDevices.map(device =>
          device.eb_idx === payload.eb_idx ? response.data : device
        ));
        loadDevices(); // 또는 목록을 다시 불러옴
        alert(`장치 ID '${payload.eb_idx}' 정보가 수정되었습니다.`);
      }
      setShowDeviceModal(false);
    } catch (error) {
      console.error("Error saving device:", error.response || error);
      alert(`장치 저장 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  // --- 공조 설비 핸들러 ---
  const handleHvacStatusToggle = async (he_idx, currentPowerStatus_boolean) => {
    const newPowerStatus_boolean = !currentPowerStatus_boolean;
    const hvacValueForApi = newPowerStatus_boolean ? 1 : 0; // API는 0 또는 1을 기대

    const targetEquipment = hvacEquipments.find(eq => eq.he_idx === he_idx);
    if (!targetEquipment) return;

    const payload = {
      he_idx: he_idx,
      c_hvac: hvacValueForApi,
      c_role: "manual", // API 명세 확인 필요
      c_type: targetEquipment.he_type, // API 명세 확인 필요 (또는 다른 값)
    };

    // setIsLoadingHvac(true); // 특정 설비에 대한 로딩 상태 관리가 더 좋을 수 있음
    try {
      const response = await controlHvacAPI(payload);
      if (response.data && response.data.status === 'sent') {
        // API 성공 응답 후 프론트엔드 상태 업데이트
        const updatedTime = response.data.controlled_at || new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0,19); // YYYY-MM-DDTHH:mm:ss
        setHvacEquipments(prevEquipments =>
          prevEquipments.map(eq =>
            eq.he_idx === he_idx ? { ...eq, he_power: newPowerStatus_boolean, last_controlled_at: updatedTime } : eq
          )
        );
        console.log(`Toggled HVAC ID: ${he_idx} to ${newPowerStatus_boolean ? 'ON' : 'OFF'}. Response:`, response.data);
      } else {
        alert(response.data.message || "공조 설비 조작에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error controlling HVAC:", error.response || error);
      alert(`공조 설비 조작 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
      // 실패 시 UI 롤백 로직 필요
    } finally {
      // setIsLoadingHvac(false);
    }
  };

  // --- JSX 렌더링 ---
  return (
    <div className="page-device-management">
      <header className="main-header">
        <div className="header-title-section">
          <h2>측정 장치 관리</h2>
        </div>
        <div className="header-actions">
          <button onClick={handleAddDevice} className="action-btn primary-btn" disabled={isLoadingDevices || isLoadingHvac}>
            <i className="fas fa-plus"></i> 새 장치 추가
          </button>
        </div>
      </header>

      <main className="content-area" style={{paddingBottom: '40px'}}>
        {isLoadingDevices && <p className="loading-message">측정 장치 목록을 불러오는 중...</p>}
        {devicesError && <p className="error-message">{devicesError}</p>}
        {!isLoadingDevices && !devicesError && (
          <div className="device-list-container">
            <table>
              <thead>
                <tr>
                  <th>장치 ID (eb_idx)</th>
                  <th>장치명 (eb_name)</th>
                  <th>설치 위치 (eb_loc)</th>
                  <th>상태 (status)</th>
                  <th>PM2.5</th>
                  <th>PM1.0</th>
                  <th>온도</th>
                  <th>습도</th>
                  <th>최근 업데이트 (lastUpdate)</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody id="devicesTableBody">
                {devices.map(device => (
                  <tr key={device.eb_idx}>
                    <td>{device.eb_idx}</td>
                    <td>{device.eb_name}</td>
                    <td className="allow-wrap">{device.eb_loc}</td>
                    <td>
                      <span className={`device-status ${String(device.status).toLowerCase()}`}>
                        {device.status === 'online' ? '온라인' : '오프라인'}
                      </span>
                    </td>
                    <td>{device.pm25 !== undefined ? device.pm25.toFixed(1) : '-'}</td>
                    <td>{device.pm10 !== undefined ? device.pm10.toFixed(1) : '-'}</td>
                    <td>{device.temp !== undefined ? device.temp.toFixed(1) : '-'} °C</td>
                    <td>{device.humidity !== undefined ? device.humidity.toFixed(0) : '-'} %</td>
                    <td>{device.lastUpdate ? new Date(device.lastUpdate).toLocaleString('ko-KR') : '-'}</td>
                    <td>
                      <button onClick={() => handleEditDevice(device)} className="action-btn mini-btn">수정</button>
                      <button onClick={() => handleDeleteDevice(device.eb_idx)} className="action-btn mini-btn delete-btn">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {devices.length === 0 && <p className="no-data-message">표시할 측정 장치가 없습니다.</p>}
          </div>
        )}

        <h2 style={{ marginTop: '40px', marginBottom: '15px', fontSize: '1.8em', fontWeight: '500', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          공조 설비 관리
        </h2>
        {isLoadingHvac && <p className="loading-message">공조 설비 목록을 불러오는 중...</p>}
        {hvacError && <p className="error-message">{hvacError}</p>}
        {!isLoadingHvac && !hvacError && (
          <div className="device-list-container hvac-list-container">
            <table>
              <thead>
                <tr>
                  <th>설비 ID (he_idx)</th>
                  <th>설비 종류 (he_type)</th>
                  <th>설비명 (he_name)</th>
                  <th>설치 위치 (he_location)</th>
                  <th>최근 조작 (last_controlled_at)</th>
                  <th>상태 (he_power)</th>
                </tr>
              </thead>
              <tbody>
                {hvacEquipments.map(eq => (
                  <tr key={eq.he_idx}>
                    <td>{eq.he_idx}</td>
                    <td>{eq.he_type}</td>
                    <td>{eq.he_name}</td>
                    <td className="allow-wrap">{eq.he_location}</td>
                    <td>{eq.last_controlled_at ? new Date(eq.last_controlled_at).toLocaleString('ko-KR') : '-'}</td>
                    <td>
                      <label className="switch table-switch">
                        <input
                          type="checkbox"
                          checked={!!eq.he_power}
                          onChange={() => handleHvacStatusToggle(eq.he_idx, eq.he_power)}
                        />
                        <span className="slider round"></span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hvacEquipments.length === 0 && <p className="no-data-message">표시할 공조 설비가 없습니다.</p>}
          </div>
        )}
      </main>

      <DeviceModal
        show={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        onSave={handleSaveDevice}
        deviceData={currentDeviceData}
        setDeviceData={setCurrentDeviceData}
        modalTitle={deviceModalTitle}
      />
    </div>
  );
};

export default DeviceManagementPage;