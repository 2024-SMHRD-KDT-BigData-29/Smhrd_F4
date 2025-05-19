// src/pages/DeviceManagementPage.js
import React, { useState, useEffect } from 'react';
// import './DeviceManagementPage.css'; // 필요하다면 별도 CSS 파일 생성

// 가짜 장치 데이터 (실제로는 API를 통해 받아옵니다)
const mockDevices = [
  { id: 'FAB1-RPi-001', name: 'RPi4-클린룸A', location: '1공장 클린룸 A-1', status: 'online', pm25: 9.3, pm10: 13.8, temp: 20.4, humidity: 43, lastUpdate: '2025. 5. 14. 오후 4:35:42' },
  { id: 'FAB1-RPi-002', name: 'RPi4-예열라인', location: '1공장 예열라인 후단', status: 'online', pm25: 11.3, pm10: 15.0, temp: 22.0, humidity: 42, lastUpdate: '2025. 5. 14. 오후 4:35:42' },
  { id: 'FAB2-RPi-001', name: 'RPi3B-가스실', location: '2공장 가스 저장실', status: 'offline', pm25: 8.1, pm10: 15.2, temp: 22.0, humidity: 45, lastUpdate: '2025. 5. 14. 오전 11:35:42' },
  // ... 추가 장치 데이터
];
const mockHvacEquipments = [
  { id: 'hvac-fan-001', type: '선풍기', location: '휴게실 A', lastUpdate: '2025. 5. 19. 오전 10:00:00', status: true }, // true: ON, false: OFF
  { id: 'hvac-ac-001', type: '에어컨', location: '사무실 B', lastUpdate: '2025. 5. 19. 오전 09:30:00', status: false },
  { id: 'hvac-purifier-001', type: '공기 청정기', location: '회의실 C', lastUpdate: '2025. 5. 19. 오전 11:00:00', status: true },
  { id: 'hvac-fan-002', type: '선풍기', location: '작업장 D-1', lastUpdate: '2025. 5. 18. 오후 05:15:00', status: false },
];


// 모달 구현을 위한 임시 상태 (추후 별도 Modal 컴포넌트로 분리하거나 Context API 사용 가능)
const DeviceModal = ({ show, onClose, onSave, deviceData, setDeviceData, modalTitle }) => {
  if (!show) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDeviceData(prev => ({ ...prev, [name]: value }));
  };

  return (
    // App.css의 .modal, .modal-content 등 클래스 활용
    <div className="modal show"> {/* show 클래스를 props로 제어 */}
      <div className="modal-content">
        <div className="modal-header">
          <h3 id="modalTitle">{modalTitle}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <form id="deviceForm"> {/* App.css의 form-group 활용 */}
            {/* <input type="hidden" id="deviceModifyIdHidden" name="id" value={deviceData.id || ''} /> */}
            <div className="form-group">
              <label htmlFor="deviceIdInput">장치 ID (예: FAB1-RPi-001):</label>
              <input type="text" id="deviceIdInput" name="id" placeholder="고유 ID 입력" value={deviceData.id || ''} onChange={handleChange} required disabled={modalTitle !== "새 장치 추가"} />
            </div>
            <div className="form-group">
              <label htmlFor="deviceNameInput">장치명/모델 (예: RPi Model 4 + PMS5003):</label>
              <input type="text" id="deviceNameInput" name="name" placeholder="Raspberry Pi 모델 및 센서 정보" value={deviceData.name || ''} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="deviceLocationInput">설치 위치 (예: 클린룸 A-1 구역 천장):</label>
              <input type="text" id="deviceLocationInput" name="location" placeholder="공장 내 상세 위치" value={deviceData.location || ''} onChange={handleChange} />
            </div>
            {/* <div className="form-group">
              <label htmlFor="deviceDescriptionInput">추가 설명:</label>
              <input type="text" id="deviceDescriptionInput" name="description" placeholder="예: PM1.0 집중 모니터링" value={deviceData.description || ''} onChange={handleChange} />
            </div> */}
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


const DeviceManagementPage = () => {
  const [devices, setDevices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentDevice, setCurrentDevice] = useState({}); // 모달에서 사용할 장치 데이터
  const [modalTitle, setModalTitle] = useState("새 장치 추가");

const [hvacEquipments, setHvacEquipments] = useState([]);


  useEffect(() => {
    // 실제로는 API 호출
    setDevices(mockDevices);
    setHvacEquipments(mockHvacEquipments); // 공조 설비 목 데이터 로드
  }, []);

  const handleAddDevice = () => {
    setCurrentDevice({ id: '', name: '', location: '' }); // 새 장치 데이터 초기화
    setModalTitle("새 장치 추가");
    setShowModal(true);
  };

  const handleEditDevice = (device) => {
    setCurrentDevice(device);
    setModalTitle("장치 정보 수정");
    setShowModal(true);
  };

  const handleDeleteDevice = (deviceId) => {
    if (window.confirm(`정말로 장치 ID '${deviceId}'를 삭제하시겠습니까?`)) {
      // 실제로는 API 호출
      setDevices(prevDevices => prevDevices.filter(device => device.id !== deviceId));
      console.log("삭제된 장치 ID:", deviceId);
    }
  };

  const handleSaveDevice = () => {
    // 실제로는 API 호출
    if (modalTitle === "새 장치 추가") {
      // currentDevice에 id가 없다면 (또는 중복 검사 후) 새 ID 생성 또는 입력값 사용
      // 여기서는 currentDevice.id가 이미 입력되었다고 가정
      if(!currentDevice.id) {
        alert("장치 ID를 입력해주세요.");
        return;
      }
      setDevices(prevDevices => [...prevDevices, { ...currentDevice, status: 'offline', lastUpdate: new Date().toLocaleString() }]); // 임시 상태 및 시간
    } else { // 수정
      setDevices(prevDevices => prevDevices.map(device => device.id === currentDevice.id ? { ...currentDevice, status: device.status, lastUpdate: new Date().toLocaleString() } : device));
    }
    console.log("저장된 장치 정보:", currentDevice);
    setShowModal(false);
  };

 // 공조 설비 상태 토글 핸들러
  const handleHvacStatusToggle = (equipmentId) => {
    setHvacEquipments(prevEquipments =>
      prevEquipments.map(eq =>
        eq.id === equipmentId
          ? { ...eq, status: !eq.status, lastUpdate: new Date().toLocaleString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
          : eq
      )
    );
    // 실제로는 여기에 API 호출하여 서버의 상태를 업데이트합니다.
    console.log(`Toggled status for HVAC equipment ID: ${equipmentId}`);
  };





  return (
    <div className="page-device-management"> {/* 페이지 전체를 감싸는 div (필요시 스타일 추가) */}
      <header className="main-header"> {/* App.css의 .main-header 스타일 활용 */}
        <div className="header-title-section">
          <h2>측정 장치 관리</h2>
        </div>
        <div className="header-actions">
          <button onClick={handleAddDevice} className="action-btn primary-btn">
            <i className="fas fa-plus"></i> 새 장치 추가
          </button>
        </div>
      </header>

      <main className="content-area" style={{paddingBottom: '40px'}}> {/* App.css의 .content-area 스타일 활용 */}
        <div className="device-list-container"> {/* App.css의 스타일 활용 */}
          <table>
            <thead>
              <tr>
                <th>장치 ID</th>
                <th>장치명/모델</th>
                <th>설치 위치</th>
                <th>상태</th>
                <th>PM2.5</th>
                <th>PM10</th>
                <th>온도</th>
                <th>습도</th>
                <th>최근 업데이트</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody id="devicesTableBody">
              {devices.map(device => (
                <tr key={device.id}>
                  <td>{device.id}</td>
                  <td>{device.name}</td>
                  <td>{device.location}</td>
                  <td>
                    <span className={`device-status ${device.status.toLowerCase()}`}>
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
                    <button onClick={() => handleDeleteDevice(device.id)} className="action-btn mini-btn delete-btn">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {devices.length === 0 && <p style={{textAlign: 'center', padding: '20px'}}>표시할 장치가 없습니다.</p>}
        </div>
           <h2 style={{ marginTop: '40px', marginBottom: '15px', fontSize: '1.8em', fontWeight: '500', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          공조 설비 관리
        </h2>
        <div className="device-list-container hvac-list-container"> {/* 기존 device-list-container 스타일 재활용 또는 hvac-list-container로 커스텀 */}
          <table>
            <thead>
              <tr>
                <th>설비 ID</th>
                <th>설비 종류</th>
                <th>설치 위치</th>
                <th>최근 업데이트</th>
                <th>상태 (ON/OFF)</th>
                {/* <th>작업</th> */} {/* 필요하다면 작업 열 추가 */}
              </tr>
            </thead>
            <tbody>
              {hvacEquipments.map(eq => (
                <tr key={eq.id}>
                  <td>{eq.id}</td>
                  <td>{eq.type}</td>
                  <td>{eq.location}</td>
                  <td>{eq.lastUpdate}</td>
                  <td>
                    <label className="switch table-switch"> {/* 테이블 내 스위치를 위한 추가 클래스 */}
                      <input
                        type="checkbox"
                        checked={eq.status}
                        onChange={() => handleHvacStatusToggle(eq.id)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </td>
                  {/* <td>
                    <button className="action-btn mini-btn">관리</button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
          {hvacEquipments.length === 0 && <p style={{textAlign: 'center', padding: '20px'}}>표시할 공조 설비가 없습니다.</p>}
        </div>









      </main>

      <DeviceModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveDevice}
        deviceData={currentDevice}
        setDeviceData={setCurrentDevice}
        modalTitle={modalTitle}
      />
    </div>
  );
};

export default DeviceManagementPage;