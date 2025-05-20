import React, { useState, useEffect } from 'react';
// import { fetchDevicesAPI, addDeviceAPI, updateDeviceAPI, deleteDeviceAPI, fetchHvacEquipmentsAPI, controlHvacAPI } from '../apiService'; // 실제 API 서비스 import

// --- Mock 데이터 정의 (API 연동 전까지 사용, API 명세에 최대한 맞춤) ---
const mockDevicesUpdated = [
  { eb_idx: 'FAB1-RPi-001', m_id:'admin', eb_name: 'RPi4-클린룸A', eb_loc: '1공장 클린룸 A-1', status: 'online', pm25: 9.3, pm10: 13.8, temp: 20.4, humidity: 43, lastUpdate: '2025. 5. 14. 오후 4:35:42', install_date: '2024-01-10', eb_serial_num: 'SN001' },
  { eb_idx: 'FAB1-RPi-002', m_id:'admin', eb_name: 'RPi4-예열라인', eb_loc: '1공장 예열라인 후단', status: 'online', pm25: 11.3, pm10: 15.0, temp: 22.0, humidity: 42, lastUpdate: '2025. 5. 14. 오후 4:35:42', install_date: '2024-02-15', eb_serial_num: 'SN002' },
  { eb_idx: 'FAB2-RPi-001', m_id:'admin', eb_name: 'RPi3B-가스실', eb_loc: '2공장 가스 저장실', status: 'offline', pm25: 8.1, pm10: 15.2, temp: 22.0, humidity: 45, lastUpdate: '2025. 5. 14. 오전 11:35:42', install_date: '2024-03-20', eb_serial_num: 'SN003' },
];

const mockHvacEquipmentsUpdated = [
  { he_idx: 'hvac-fan-001', he_type: '선풍기', he_name: '휴게실 선풍기 A', he_location: '휴게실 A', last_controlled_at: '2025-05-19 10:00:00', he_power: true },
  { he_idx: 'hvac-ac-001', he_type: '에어컨', he_name: '사무실 에어컨 B', he_location: '사무실 B', last_controlled_at: '2025-05-19 09:30:00', he_power: false },
  { he_idx: 'hvac-purifier-001', he_type: '공기 청정기', he_name: '회의실 공청기 C', he_location: '회의실 C', last_controlled_at: '2025-05-19 11:00:00', he_power: true },
];
// --- Mock 데이터 정의 끝 ---





// --- DeviceModal 컴포넌트 (측정 장치 추가/수정용) ---
const DeviceModal = ({ show, onClose, onSave, deviceData, setDeviceData, modalTitle }) => {
  if (!show) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDeviceData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal show">
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
            {/* 관리자 ID (m_id)는 보통 자동으로 할당되거나 백엔드에서 처리하므로, 폼에서는 제외 가능 */}
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
// --- DeviceModal 컴포넌트 끝 ---


// --- DeviceManagementPage 컴포넌트 ---
const DeviceManagementPage = ({ currentUser }) => { // App.js로부터 currentUser를 받을 수 있음
  const [devices, setDevices] = useState([]);
  const [hvacEquipments, setHvacEquipments] = useState([]);

  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [currentDeviceData, setCurrentDeviceData] = useState({ // 측정 장치 모달용 데이터
    eb_idx: '', eb_name: '', eb_loc: '', install_date: '', eb_serial_num: '', m_id: ''
  });
  const [deviceModalTitle, setDeviceModalTitle] = useState("새 장치 추가");

  // 로딩 및 에러 상태 (선택 사항이지만 권장)
   const [isLoadingDevices, setIsLoadingDevices] = useState(false);
   const [devicesError, setDevicesError] = useState(null);
   const [isLoadingHvac, setIsLoadingHvac] = useState(false);
   const [hvacError, setHvacError] = useState(null);

  useEffect(() => {
    // --- 실제 API 호출 로직 (주석 처리된 예시) ---
    /*
    const loadInitialData = async () => {
      // 측정 장치 로드
      setIsLoadingDevices(true);
      setDevicesError(null);
      try {
        const deviceResponse = await fetchDevicesAPI(); // API 호출
        setDevices(deviceResponse.data || []); // API 응답 형식에 맞춰서
      } catch (error) {
        console.error("Error fetching devices:", error);
        setDevicesError("장치 목록을 불러오는 데 실패했습니다.");
      } finally {
        setIsLoadingDevices(false);
      }

      // 공조 설비 로드
      setIsLoadingHvac(true);
      setHvacError(null);
      try {
        // const hvacResponse = await fetchHvacEquipmentsAPI(); // API 호출 (이 API는 명세에 아직 없음)
        // setHvacEquipments(hvacResponse.data || []);
        setHvacEquipments(mockHvacEquipmentsUpdated); // 임시
      } catch (error) {
        console.error("Error fetching HVAC equipments:", error);
        setHvacError("공조 설비 목록을 불러오는 데 실패했습니다.");
      } finally {
        setIsLoadingHvac(false);
      }
    };
    loadInitialData();
    */

    // Mock 데이터 사용
    setDevices(mockDevicesUpdated);
    setHvacEquipments(mockHvacEquipmentsUpdated);
  }, []);

  // --- 측정 장치 핸들러 ---
  const handleAddDevice = () => {
    setCurrentDeviceData({ eb_idx: '', eb_name: '', eb_loc: '', install_date: '', eb_serial_num: '', m_id: currentUser?.m_id || '' }); // 로그인 사용자 m_id 추가 (선택)
    setDeviceModalTitle("새 장치 추가");
    setShowDeviceModal(true);
  };

  const handleEditDevice = (device) => {
    setCurrentDeviceData(device); // device 객체는 이미 API 응답 형식과 일치해야 함
    setDeviceModalTitle("장치 정보 수정");
    setShowDeviceModal(true);
  };

  const handleDeleteDevice = async (eb_idx) => {
    if (window.confirm(`정말로 장치 ID '${eb_idx}'를 삭제하시겠습니까?`)) {
      try {
        // await deleteDeviceAPI(eb_idx); // API 호출
        setDevices(prevDevices => prevDevices.filter(device => device.eb_idx !== eb_idx));
        console.log("삭제된 장치 ID (eb_idx):", eb_idx);
      } catch (error) {
        console.error("Error deleting device:", error);
        alert("장치 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const handleSaveDevice = async () => {
    // API로 보낼 payload 구성 (실제 API 명세에 따라 필드 조정)
    const payload = { ...currentDeviceData };
    // m_id는 currentUser에서 가져오거나, 백엔드에서 토큰 기반으로 처리할 수 있음
    if (currentUser && currentUser.m_id) {
        payload.m_id = currentUser.m_id;
    }


    try {
      if (deviceModalTitle === "새 장치 추가") {
        if (!payload.eb_idx) {
          alert("장치 ID (eb_idx)를 입력해주세요.");
          return;
        }
        // const response = await addDeviceAPI(payload); // API 호출
        // setDevices(prevDevices => [...prevDevices, response.data]); // API 응답으로 받은 새 장치 정보 추가

        // Mock 동작
        const newDeviceWithDefaults = { ...payload, status: 'offline', lastUpdate: new Date().toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\. /g, '.').slice(0, -1) };
        setDevices(prevDevices => [...prevDevices, newDeviceWithDefaults]);

      } else { // 수정
        // const response = await updateDeviceAPI(payload.eb_idx, payload); // API 호출
        // setDevices(prevDevices => prevDevices.map(device =>
        //   device.eb_idx === payload.eb_idx ? response.data : device
        // ));

        // Mock 동작
        const updatedDeviceWithDefaults = { ...payload, lastUpdate: new Date().toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\. /g, '.').slice(0, -1) };
        setDevices(prevDevices => prevDevices.map(device =>
          device.eb_idx === payload.eb_idx ? updatedDeviceWithDefaults : device
        ));
      }
      console.log("저장된 장치 정보:", payload);
      setShowDeviceModal(false);
    } catch (error) {
      console.error("Error saving device:", error);
      alert("장치 저장 중 오류가 발생했습니다.");
    }
  };

  // --- 공조 설비 핸들러 ---
  const handleHvacStatusToggle = async (he_idx, currentPowerStatus) => {
    const newPowerStatus = !currentPowerStatus;
    const hvacValueForApi = newPowerStatus ? 1 : 0;

    const targetEquipment = hvacEquipments.find(eq => eq.he_idx === he_idx);
    if (!targetEquipment) return;

    const payload = {
      he_idx: he_idx,
      c_hvac: hvacValueForApi,
      c_role: "manual", // API 명세에 따라 'auto' 또는 다른 값
      c_type: targetEquipment.he_type, // 또는 API가 기대하는 특정 제어 타입 문자열
    };

    try {
      // const response = await controlHvacAPI(payload); // API 호출
      // if (response.data && response.data.status === 'sent') {
      //   const updatedTime = response.data.controlled_at || new Date().toLocaleString(...);
      //   setHvacEquipments(prevEquipments =>
      //     prevEquipments.map(eq =>
      //       eq.he_idx === he_idx ? { ...eq, he_power: newPowerStatus, last_controlled_at: updatedTime } : eq
      //     )
      //   );
      // } else {
      //   alert(response.data.message || "공조 설비 조작에 실패했습니다.");
      // }

      // Mock 동작
      const updatedTime = new Date().toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\. /g, '.').slice(0, -1);
      setHvacEquipments(prevEquipments =>
        prevEquipments.map(eq =>
          eq.he_idx === he_idx ? { ...eq, he_power: newPowerStatus, last_controlled_at: updatedTime } : eq
        )
      );
      console.log(`Toggled HVAC ID: ${he_idx} to ${newPowerStatus ? 'ON' : 'OFF'}. Payload:`, payload);

    } catch (error) {
      console.error("Error controlling HVAC:", error);
      alert("공조 설비 조작 중 오류가 발생했습니다.");
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
          <button onClick={handleAddDevice} className="action-btn primary-btn">
            <i className="fas fa-plus"></i> 새 장치 추가
          </button>
        </div>
      </header>

      <main className="content-area" style={{paddingBottom: '40px'}}>
        {/* {isLoadingDevices && <p>측정 장치 목록을 불러오는 중...</p>}
        {devicesError && <p style={{color: 'red'}}>{devicesError}</p>} */}
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
                  <td>{device.eb_loc}</td>
                  <td>
                    <span className={`device-status ${String(device.status).toLowerCase()}`}>
                      {device.status === 'online' ? '온라인' : '오프라인'}
                    </span>
                  </td>
                  <td>{device.pm25 !== undefined ? device.pm25.toFixed(1) : '-'}</td>
                  <td>{device.pm10 !== undefined ? device.pm10.toFixed(1) : '-'}</td>
                  <td>{device.temp !== undefined ? device.temp.toFixed(1) : '-'} °C</td>
                  <td>{device.humidity !== undefined ? device.humidity.toFixed(0) : '-'} %</td>
                  <td>{device.lastUpdate}</td>
                  <td>
                    <button onClick={() => handleEditDevice(device)} className="action-btn mini-btn">수정</button>
                    <button onClick={() => handleDeleteDevice(device.eb_idx)} className="action-btn mini-btn delete-btn">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {devices.length === 0 && !isLoadingDevices && <p style={{textAlign: 'center', padding: '20px'}}>표시할 측정 장치가 없습니다.</p>}
        </div>

        <h2 style={{ marginTop: '40px', marginBottom: '15px', fontSize: '1.8em', fontWeight: '500', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          공조 설비 관리
        </h2>
        {/* {isLoadingHvac && <p>공조 설비 목록을 불러오는 중...</p>}
        {hvacError && <p style={{color: 'red'}}>{hvacError}</p>} */}
        <div className="device-list-container hvac-list-container">
          <table>
            <thead>
              <tr>
                <th>설비 ID (he_idx)</th>
                <th>설비 종류 (he_type)</th>
                <th>설비명 (he_name)</th>
                <th>설치 위치 (he_location)</th>
                <th>최근 업데이트 (last_controlled_at)</th>
                <th>상태 (he_power)</th>
              </tr>
            </thead>
            <tbody>
              {hvacEquipments.map(eq => (
                <tr key={eq.he_idx}>
                  <td>{eq.he_idx}</td>
                  <td>{eq.he_type}</td>
                  <td>{eq.he_name}</td>
                  <td>{eq.he_location}</td>
                  <td>{eq.last_controlled_at}</td>
                  <td>
                    <label className="switch table-switch">
                      <input
                        type="checkbox"
                        checked={!!eq.he_power} // boolean 값으로 확실히 처리
                        onChange={() => handleHvacStatusToggle(eq.he_idx, eq.he_power)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hvacEquipments.length === 0 && !isLoadingHvac && <p style={{textAlign: 'center', padding: '20px'}}>표시할 공조 설비가 없습니다.</p>}
        </div>
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