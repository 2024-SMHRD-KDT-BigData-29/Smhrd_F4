import React, { useState, useEffect, useCallback } from 'react';
// import './DeviceManagementPage.css'; // 필요시 사용

// --- "측정 장치" 목업 데이터 (eb 테이블 구조 기반) ---
const mockMeasuringDevices_DBBased = [
  { eb_idx: 1, he_idx: 1, se_idx: 1, eb_name: 'RPI4-001', m_id: 'admin', eb_loc: 'S1-MetaLab', install_date: '2025-05-16' },
  { eb_idx: 2, he_idx: 2, se_idx: 2, eb_name: 'RPI4-002', m_id: 'admin', eb_loc: 'S1-DataHub', install_date: '2025-05-17' },
  { eb_idx: 3, he_idx: 3, se_idx: 3, eb_name: 'RPI4-003', m_id: 'admin', eb_loc: 'S1-ControlRoom', install_date: '2025-05-18' },
  { eb_idx: 4, he_idx: 4, se_idx: 4, eb_name: 'RPI4-004', m_id: 'admin', eb_loc: 'S1-FactoryZone', install_date: '2025-05-19' },
  { eb_idx: 5, he_idx: 5, se_idx: 5, eb_name: 'RPI4-005', m_id: 'admin', eb_loc: 'S1-TestBench', install_date: '2025-05-20' },
];

// --- "공조 설비" 목업 데이터 (기존 유지) ---
const mockHvacEquipments = [
  { id: 'hvac-fan-001', type: '환풍기', location: '휴게실 A', lastUpdate: '2025. 5. 19. 오전 10:00:00', status: true },
  { id: 'hvac-ac-001', type: '에어컨', location: '사무실 B', lastUpdate: '2025. 5. 19. 오전 09:30:00', status: false },
  { id: 'hvac-purifier-001', type: '공기 청정기', location: '회의실 C', lastUpdate: '2025. 5. 19. 오전 11:00:00', status: true },
  { id: 'hvac-fan-002', type: '환풍기', location: '작업장 D-1', lastUpdate: '2025. 5. 18. 오후 05:15:00', status: false },
];

// --- 측정 장치 추가/수정 모달 ---
const MeasuringDeviceModal = ({ show, onClose, onSave, deviceData, setDeviceData, modalTitle }) => {
  if (!show) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    // install_date 필드는 YYYY-MM-DD 형식으로 처리
    setDeviceData(prev => ({ ...prev, [name]: value }));
  };

  // 오늘 날짜를 YYYY-MM-DD 형식으로 구하기 (설치일 기본값용)
  const todayDateString = new Date().toISOString().split('T')[0];

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{modalTitle}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <form id="measuringDeviceForm">
            {/* eb_idx는 수정 시에만 표시, 새 장치 추가 시에는 자동 생성되므로 입력받지 않음 (또는 숨김 처리) */}
            {modalTitle === "장치 정보 수정" && deviceData.eb_idx && (
              <div className="form-group">
                <label htmlFor="eb_idx_input">장치 ID (eb_idx):</label>
                <input type="text" id="eb_idx_input" name="eb_idx" value={deviceData.eb_idx} readOnly disabled />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="eb_name_input">장치명 (eb_name):</label>
              <input type="text" id="eb_name_input" name="eb_name" placeholder="예: RPI4-00X" value={deviceData.eb_name || ''} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="eb_loc_input">설치 위치 (eb_loc):</label>
              <input type="text" id="eb_loc_input" name="eb_loc" placeholder="예: S1-MetaLab" value={deviceData.eb_loc || ''} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="m_id_input">담당자 (m_id):</label>
              <input type="text" id="m_id_input" name="m_id" placeholder="예: admin" value={deviceData.m_id || ''} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="install_date_input">설치일 (install_date):</label>
              <input type="date" id="install_date_input" name="install_date" value={deviceData.install_date || todayDateString} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="he_idx_input">HE_IDX (선택):</label>
              <input type="number" id="he_idx_input" name="he_idx" placeholder="숫자 입력" value={deviceData.he_idx || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="se_idx_input">SE_IDX (선택):</label>
              <input type="number" id="se_idx_input" name="se_idx" placeholder="숫자 입력" value={deviceData.se_idx || ''} onChange={handleChange} />
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


// --- DeviceManagementPage 컴포넌트 ---
const DeviceManagementPage = () => {
  // "측정 장치" 상태
  const [measuringDevices, setMeasuringDevices] = useState([]);
  const [showMeasuringDeviceModal, setShowMeasuringDeviceModal] = useState(false);
  const [currentMeasuringDevice, setCurrentMeasuringDevice] = useState({});
  const [measuringDeviceModalTitle, setMeasuringDeviceModalTitle] = useState("새 측정 장치 추가");
  const [loadingMeasuringDevices, setLoadingMeasuringDevices] = useState(true); // 측정 장치 로딩 상태

  // "공조 설비" 상태 (기존 유지)
  const [hvacEquipments, setHvacEquipments] = useState([]);
  const [loadingHvac, setLoadingHvac] = useState(true); // 공조 설비 로딩 상태 (필요시)

  // 측정 장치 목업 데이터 로드 함수
  const loadMeasuringDevices = useCallback(async () => {
    setLoadingMeasuringDevices(true);
    // API 호출 대신 목업 데이터 사용 (약간의 딜레이 시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 300));
    setMeasuringDevices(mockMeasuringDevices_DBBased);
    setLoadingMeasuringDevices(false);
  }, []);

  // 공조 설비 목업 데이터 로드 함수 (기존 유지)
  const loadHvacEquipments = useCallback(async () => {
    setLoadingHvac(true);
    await new Promise(resolve => setTimeout(resolve, 100)); // 딜레이 시뮬레이션
    setHvacEquipments(mockHvacEquipments);
    setLoadingHvac(false);
  }, []);


  useEffect(() => {
    loadMeasuringDevices();
    loadHvacEquipments();
  }, [loadMeasuringDevices, loadHvacEquipments]); // 의존성 배열에 추가

  // --- 측정 장치 핸들러 ---
  const handleAddMeasuringDevice = () => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentMeasuringDevice({ eb_name: '', eb_loc: '', m_id: 'admin', install_date: today, he_idx: null, se_idx: null });
    setMeasuringDeviceModalTitle("새 측정 장치 추가");
    setShowMeasuringDeviceModal(true);
  };

  const handleEditMeasuringDevice = (device) => {
    setCurrentMeasuringDevice({ ...device }); // 원본 수정을 피하기 위해 복사본 전달
    setMeasuringDeviceModalTitle("장치 정보 수정");
    setShowMeasuringDeviceModal(true);
  };

  const handleDeleteMeasuringDevice = (eb_idx_to_delete) => {
    if (eb_idx_to_delete === 1) {
      alert("RPI4-001 (eb_idx: 1) 장치는 핵심 장비이므로 삭제할 수 없습니다.");
      return;
    }
    if (window.confirm(`정말로 장치 ID '${eb_idx_to_delete}'를 삭제하시겠습니까? (목업 데이터에서만 제거)`)) {
      setMeasuringDevices(prevDevices => prevDevices.filter(device => device.eb_idx !== eb_idx_to_delete));
      console.log("삭제된 측정 장치 ID (목업):", eb_idx_to_delete);
    }
  };

  const handleSaveMeasuringDevice = () => {
    if (!currentMeasuringDevice.eb_name || !currentMeasuringDevice.eb_loc || !currentMeasuringDevice.m_id || !currentMeasuringDevice.install_date) {
        alert("장치명, 설치 위치, 담당자, 설치일은 필수 입력 항목입니다.");
        return;
    }

    if (measuringDeviceModalTitle === "새 측정 장치 추가") {
      // 새 eb_idx 생성 (목업 환경에서는 현재 ID 중 최대값 + 1)
      const newId = measuringDevices.length > 0 ? Math.max(...measuringDevices.map(d => d.eb_idx)) + 1 : 1;
      const newDevice = {
        ...currentMeasuringDevice,
        eb_idx: newId,
        // he_idx와 se_idx는 빈 문자열일 경우 null로 저장 (DB 스키마에 따라)
        he_idx: currentMeasuringDevice.he_idx ? parseInt(currentMeasuringDevice.he_idx, 10) : null,
        se_idx: currentMeasuringDevice.se_idx ? parseInt(currentMeasuringDevice.se_idx, 10) : null,
      };
      setMeasuringDevices(prevDevices => [...prevDevices, newDevice]);
      console.log("추가된 측정 장치 정보 (목업):", newDevice);
    } else { // 수정
      const updatedDevice = {
        ...currentMeasuringDevice,
        he_idx: currentMeasuringDevice.he_idx ? parseInt(currentMeasuringDevice.he_idx, 10) : null,
        se_idx: currentMeasuringDevice.se_idx ? parseInt(currentMeasuringDevice.se_idx, 10) : null,
      };
      setMeasuringDevices(prevDevices => prevDevices.map(device =>
        device.eb_idx === updatedDevice.eb_idx ? updatedDevice : device
      ));
      console.log("수정된 측정 장치 정보 (목업):", updatedDevice);
    }
    setShowMeasuringDeviceModal(false);
  };

  // --- 공조 설비 핸들러 (기존 유지) ---
  const handleHvacStatusToggle = (equipmentId) => {
    setHvacEquipments(prevEquipments =>
      prevEquipments.map(eq =>
        eq.id === equipmentId
          ? { ...eq, status: !eq.status, lastUpdate: new Date().toLocaleString('ko-KR') }
          : eq
      )
    );
    console.log(`Toggled status for HVAC equipment ID: ${equipmentId}`);
  };

  // 로딩 UI
  if (loadingMeasuringDevices || loadingHvac) {
      return <div className="page-device-management"><p>데이터를 불러오는 중...</p></div>;
  }

  return (
    <div className="page-device-management">
      {/* --- 측정 장치 관리 섹션 --- */}
      <header className="main-header">
        <div className="header-title-section">
          <h2>측정 장치 관리</h2>
        </div>
        <div className="header-actions">
          <button onClick={handleAddMeasuringDevice} className="action-btn primary-btn">
            <i className="fas fa-plus"></i> 새 측정 장치 추가
          </button>
        </div>
      </header>
      <main className="content-area" style={{ paddingBottom: '40px',paddingLeft: '30px' }}>
        <div className="device-list-container">
          <table>
            <thead>
              <tr>
                <th>ID </th>
                <th>장치명</th>
                <th>설치 위치 </th>
                <th>담당자 </th>
                <th>설치일</th>
                <th>HE_IDX</th>
                <th>SE_IDX</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {measuringDevices.map(device => (
                <tr key={device.eb_idx} className={device.eb_idx === 1 ? 'highlighted-device' : ''}>
                  <td>{device.eb_idx}</td>
                  <td>
                    {device.eb_name}
                    {device.eb_idx === 1 && <span className="rpi-tag"> (RPi)</span>}
                  </td>
                  <td>{device.eb_loc}</td>
                  <td>{device.m_id}</td>
                  <td>{new Date(device.install_date).toLocaleDateString('ko-KR')}</td>
                  <td>{device.he_idx !== null ? device.he_idx : 'N/A'}</td>
                  <td>{device.se_idx !== null ? device.se_idx : 'N/A'}</td>
                  <td>
                    <button onClick={() => handleEditMeasuringDevice(device)} className="action-btn mini-btn">수정</button>
                    {device.eb_idx !== 1 && ( // RPi 장치는 삭제 버튼 비활성화 대신 아예 안 보이게 할 수도 있습니다.
                      <button onClick={() => handleDeleteMeasuringDevice(device.eb_idx)} className="action-btn mini-btn delete-btn">삭제</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {measuringDevices.length === 0 && !loadingMeasuringDevices && <p style={{ textAlign: 'center', padding: '20px' }}>표시할 측정 장치가 없습니다.</p>}
        </div>

        {/* --- 공조 설비 관리 섹션 (기존 유지) --- */}
        <h2 style={{ marginTop: '40ipx', marginBottom: '15px', fontSize: '1.8em', fontWeght: '500', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          공조 설비 관리
        </h2>
        <div className="device-list-container hvac-list-container">
          <table>
            <thead>
              <tr>
                <th>설비 ID</th>
                <th>설비 종류</th>
                <th>설치 위치</th>
                <th>최근 업데이트</th>
                <th>상태 (ON/OFF)</th>
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
                    <label className="switch table-switch">
                      <input
                        type="checkbox"
                        checked={eq.status}
                        onChange={() => handleHvacStatusToggle(eq.id)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hvacEquipments.length === 0 && !loadingHvac && <p style={{ textAlign: 'center', padding: '20px' }}>표시할 공조 설비가 없습니다.</p>}
        </div>
      </main>

      <MeasuringDeviceModal
        show={showMeasuringDeviceModal}
        onClose={() => setShowMeasuringDeviceModal(false)}
        onSave={handleSaveMeasuringDevice}
        deviceData={currentMeasuringDevice}
        setDeviceData={setCurrentMeasuringDevice}
        modalTitle={measuringDeviceModalTitle}
      />
    </div>
  );
};

export default DeviceManagementPage;