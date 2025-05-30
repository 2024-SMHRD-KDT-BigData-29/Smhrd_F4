import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // axios import
// import './DeviceManagementPage.css'; // 필요시 사용

// 백엔드 API 기본 URL (실제 API 주소로 변경하세요)
// .env 파일에 REACT_APP_API_URL=http://localhost:YOUR_BACKEND_PORT/api 와 같이 설정하고 사용하는 것을 권장합니다.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'; // PyCharm(Python 백엔드) 기본 포트 예시

// --- 측정 장치 추가/수정 모달 (tb_edge_board 용) ---
// 이 모달은 이전과 거의 동일하게 사용될 수 있습니다.
// tb_edge_board의 컬럼과 잘 매칭됩니다.
const MeasuringDeviceModal = ({ show, onClose, onSave, deviceData, setDeviceData, modalTitle }) => {
  if (!show) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDeviceData(prev => ({ ...prev, [name]: value }));
  };

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
            {modalTitle === "장치 정보 수정" && deviceData.eb_idx && (
              <div className="form-group">
                <label htmlFor="eb_idx_input">장치 ID </label>
                <input type="text" id="eb_idx_input" name="eb_idx" value={deviceData.eb_idx} readOnly disabled />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="eb_name_input">장치명 :</label>
              <input type="text" id="eb_name_input" name="eb_name" placeholder="예: RPI4-00X" value={deviceData.eb_name || ''} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="eb_loc_input">설치 위치 :</label>
              <input type="text" id="eb_loc_input" name="eb_loc" placeholder="예: S1-MetaLab" value={deviceData.eb_loc || ''} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="m_id_input">담당자 :</label>
              <input type="text" id="m_id_input" name="m_id" placeholder="예: admin" value={deviceData.m_id || ''} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="install_date_input">설치일 (install_date):</label>
              <input type="date" id="install_date_input" name="install_date" value={deviceData.install_date || todayDateString} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="he_idx_input">HE_IDX (공조설비 ID, 선택):</label>
              <input type="number" id="he_idx_input" name="he_idx" placeholder="숫자 입력" value={deviceData.he_idx === null || deviceData.he_idx === undefined ? '' : deviceData.he_idx} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="se_idx_input">SE_IDX (센서 ID, 선택):</label>
              <input type="number" id="se_idx_input" name="se_idx" placeholder="숫자 입력" value={deviceData.se_idx === null || deviceData.se_idx === undefined ? '' : deviceData.se_idx} onChange={handleChange} />
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
  // "측정 장치" 상태 (tb_edge_board)
  const [measuringDevices, setMeasuringDevices] = useState([]);
  const [showMeasuringDeviceModal, setShowMeasuringDeviceModal] = useState(false);
  const [currentMeasuringDevice, setCurrentMeasuringDevice] = useState({});
  const [measuringDeviceModalTitle, setMeasuringDeviceModalTitle] = useState("새 측정 장치 추가");
  const [loadingMeasuringDevices, setLoadingMeasuringDevices] = useState(true);

  // "공조 설비" 상태 (tb_hvac_equip)
  const [hvacEquipments, setHvacEquipments] = useState([]);
  const [loadingHvac, setLoadingHvac] = useState(true);

  // 측정 장치 (tb_edge_board) 데이터 로드 함수
  const loadMeasuringDevices = useCallback(async () => {
    setLoadingMeasuringDevices(true);
    try {
      // --- 실제 API 엔드포인트로 변경 ---
      const response = await axios.get(`${API_BASE_URL}/api/edge-boards/`); // 예: /api/edge-boards/
      // DB의 install_date가 YYYY-MM-DD 형식이면 추가 변환 불필요
      // 만약 DATETIME 이면 YYYY-MM-DD 로 변환
      const formattedData = response.data.map(device => ({
        ...device,
        install_date: device.install_date ? device.install_date.split('T')[0] : '', // API 응답 형식에 따라 조정
        // he_idx, se_idx가 null일 경우를 대비
        he_idx: device.he_idx === null ? '' : device.he_idx,
        se_idx: device.se_idx === null ? '' : device.se_idx,
      }));
      setMeasuringDevices(formattedData);
    } catch (error) {
      console.error("Error fetching measuring devices:", error);
      alert("측정 장치 목록을 불러오는데 실패했습니다. API 서버 상태를 확인해주세요.");
      setMeasuringDevices([]);
    } finally {
      setLoadingMeasuringDevices(false);
    }
  }, []);

  // 공조 설비 (tb_hvac_equip) 데이터 로드 함수
  const loadHvacEquipments = useCallback(async () => {
    setLoadingHvac(true);
    try {
      // --- 실제 API 엔드포인트로 변경 ---
      const response = await axios.get(`${API_BASE_URL}/api/hvac/`); // 예: /api/hvac-equipments/
      setHvacEquipments(response.data); // API 응답 데이터 구조에 맞게 상태 업데이트
    } catch (error) {
      console.error("Error fetching HVAC equipments:", error);
      alert("공조 설비 목록을 불러오는데 실패했습니다. API 서버 상태를 확인해주세요.");
      setHvacEquipments([]);
    } finally {
      setLoadingHvac(false);
    }
  }, []);


  useEffect(() => {
    loadMeasuringDevices();
    loadHvacEquipments();
  }, [loadMeasuringDevices, loadHvacEquipments]);

  // --- 측정 장치 핸들러 (tb_edge_board) ---
  const handleAddMeasuringDevice = () => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentMeasuringDevice({
      eb_name: '',
      eb_loc: '',
      m_id: 'admin', // 기본값 또는 선택 가능하게
      install_date: today,
      he_idx: '', // 또는 null
      se_idx: ''  // 또는 null
    });
    setMeasuringDeviceModalTitle("새 측정 장치 추가");
    setShowMeasuringDeviceModal(true);
  };

  const handleEditMeasuringDevice = (device) => {
    // API에서 받은 install_date가 YYYY-MM-DD 형식이 아닐 경우 변환
    const deviceToEdit = {
        ...device,
        install_date: device.install_date ? device.install_date.split('T')[0] : '',
        he_idx: device.he_idx === null ? '' : device.he_idx,
        se_idx: device.se_idx === null ? '' : device.se_idx,
    };
    setCurrentMeasuringDevice(deviceToEdit);
    setMeasuringDeviceModalTitle("장치 정보 수정");
    setShowMeasuringDeviceModal(true);
  };

  const handleDeleteMeasuringDevice = async (eb_idx_to_delete) => {
    if (parseInt(eb_idx_to_delete) === 1) { // 핵심 장비 삭제 방지 (프론트엔드 + 백엔드 양쪽에서 체크 권장)
      alert("RPI4-001 (eb_idx: 1) 장치는 핵심 장비이므로 삭제할 수 없습니다.");
      return;
    }
    if (window.confirm(`정말로 장치 ID '${eb_idx_to_delete}'를 삭제하시겠습니까? (데이터베이스에서 영구 삭제)`)) {
      try {
        // --- 실제 API 엔드포인트로 변경 ---
        await axios.delete(`${API_BASE_URL}/api/edge-boards/${eb_idx_to_delete}/`);
        // 성공적으로 삭제 후 목록 다시 로드 또는 상태 업데이트
        // setMeasuringDevices(prevDevices => prevDevices.filter(device => device.eb_idx !== eb_idx_to_delete));
        loadMeasuringDevices(); // 목록 새로고침
        alert("장치가 성공적으로 삭제되었습니다.");
      } catch (error) {
        console.error("Error deleting measuring device:", error);
        alert(`장치 삭제 실패: ${error.response?.data?.detail || error.response?.data?.error || error.message}`);
      }
    }
  };

  const handleSaveMeasuringDevice = async () => {
    if (!currentMeasuringDevice.eb_name || !currentMeasuringDevice.eb_loc || !currentMeasuringDevice.m_id || !currentMeasuringDevice.install_date) {
        alert("장치명, 설치 위치, 담당자, 설치일은 필수 입력 항목입니다.");
        return;
    }

    // he_idx, se_idx가 빈 문자열이면 null로, 아니면 숫자로 변환 (API 요구사항에 따라 조정)
    const devicePayload = {
        ...currentMeasuringDevice,
        he_idx: currentMeasuringDevice.he_idx === '' || currentMeasuringDevice.he_idx === null ? null : parseInt(currentMeasuringDevice.he_idx, 10),
        se_idx: currentMeasuringDevice.se_idx === '' || currentMeasuringDevice.se_idx === null ? null : parseInt(currentMeasuringDevice.se_idx, 10),
    };
    // eb_idx는 추가 시에는 보내지 않음 (백엔드에서 자동 생성)
    if (measuringDeviceModalTitle === "새 측정 장치 추가" && devicePayload.eb_idx) {
        delete devicePayload.eb_idx;
    }


    try {
      if (measuringDeviceModalTitle === "새 측정 장치 추가") {
        // --- 실제 API 엔드포인트로 변경 ---
        await axios.post(`${API_BASE_URL}/api/edge-boards/`, devicePayload);
        alert("새 장치가 성공적으로 추가되었습니다.");
      } else { // 수정
        // --- 실제 API 엔드포인트로 변경 ---
        await axios.put(`${API_BASE_URL}/api/edge-boards/${currentMeasuringDevice.eb_idx}/`, devicePayload);
        alert("장치 정보가 성공적으로 수정되었습니다.");
      }
      setShowMeasuringDeviceModal(false);
      loadMeasuringDevices(); // 저장 후 목록 새로고침
    } catch (error) {
      console.error("Error saving measuring device:", error);
      alert(`장치 저장 실패: ${error.response?.data?.detail || error.response?.data?.error || error.message}`);
    }
  };

  // --- 공조 설비 핸들러 (tb_hvac_equip) ---
  // he_power 값을 ON/OFF (1/0) 토글
  const handleHvacStatusToggle = async (hvacEquipment) => {

    const hvacId = hvacEquipment.he_idx;

    // ❗ ID가 1이 아닌 경우 연결되지 않은 장비로 간주하고 차단
    if (parseInt(hvacId) !== 1) {
      alert("공조 설비 상태 변경 실패: 유효하지 않은 엣지보드 ID입니다.");
      return;
    }

    const currentPowerState = hvacEquipment.he_power; // 현재 boolean 상태
    const newPowerStateBool = !currentPowerState;    // 반전된 boolean 상태

    // 원래의 모든 데이터를 포함하여 업데이트 (he_power만 변경)
    const payload = {
        ...hvacEquipment, // 기존 모든 필드 포함
        he_power: newPowerStateBool,
        // API가 eb_idx, sd_idx 등을 필수로 요구하면 포함시켜야 함
        // 만약 PUT 요청 시 일부 필드만 보내도 되면 필요한 것만 포함
    };
    // he_idx는 URL 파라미터로 가므로 페이로드에서 제외해도 됨 (API 설계에 따라 다름)
    // delete payload.he_idx;

    try {
        // --- 실제 API 엔드포인트로 변경 (he_idx 기준 업데이트) ---
        await axios.put(`${API_BASE_URL}/api/hvac/${hvacId}/`, payload);
        const response = await axios.put(`${API_BASE_URL}/api/hvac/${hvacId}/`, payload);
        const updatedHvacItemFromServer = response.data; // 서버로부터 받은 업데이트된 객체

        console.log("서버로부터 받은 업데이트된 항목:", updatedHvacItemFromServer); // <--- 이 로그를 추가!
        console.log("서버 응답의 he_power 타입:", typeof updatedHvacItemFromServer.he_power); // <--- 타입도 확인!
        console.log("서버 응답의 he_power 값:", updatedHvacItemFromServer.he_power); // <--- 값도 확인!



        // 상태 업데이트 성공 시 목록 새로고침 또는 로컬 상태 업데이트
         setHvacEquipments(prevEquipments =>
           prevEquipments.map(eq =>
             eq.he_idx === hvacId
               ? updatedHvacItemFromServer // lastUpdate는 API에서 관리하거나 제거
               : eq
           )
         );

        console.log(`Toggled he_power for HVAC equipment ID: ${hvacId}. New state in frontend: ${updatedHvacItemFromServer.he_power} (boolean)`);
    } catch (error) {
        console.error(`Error toggling HVAC status for ${hvacId}:`, error);
        alert(`공조 설비 상태 변경 실패: ${error.response?.data?.detail || error.response?.data?.error || error.message}`);
    }
  };

  // 로딩 UI
  if (loadingMeasuringDevices || loadingHvac) {
      return <div className="page-device-management" style={{ padding: '20px' }}><p>데이터를 불러오는 중...</p></div>;
  }

  return (
    <div className="page-device-management">
      {/* --- 측정 장치 관리 섹션 (tb_edge_board) --- */}
      <header className="main-header">
        <div className="header-title-section">
          <h2>측정 장치 관리 </h2>
        </div>
        <div className="header-actions">
          <button onClick={handleAddMeasuringDevice} className="action-btn primary-btn">
            <i className="fas fa-plus" style={{ marginRight: '5px' }}></i> 새 측정 장치 추가
          </button>
        </div>
      </header>
      <main className="content-area" style={{ paddingBottom: '40px',paddingLeft: '30px' }}>
        <div className="device-list-container">
          <table>
            <thead>
              <tr>
                <th>ID </th>
                <th>장치명 </th>
                <th>설치 위치 </th>
                <th>담당자 </th>
                <th>설치일 </th>
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
                  <td>{device.install_date}</td>
                  <td>
                    <button onClick={() => handleEditMeasuringDevice(device)} className="action-btn mini-btn">수정</button>
                    {device.eb_idx !== 1 && (
                      <button onClick={() => handleDeleteMeasuringDevice(device.eb_idx)} className="action-btn mini-btn delete-btn">삭제</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {measuringDevices.length === 0 && !loadingMeasuringDevices && <p style={{ textAlign: 'center', padding: '20px' }}>표시할 측정 장치가 없습니다.</p>}
        </div>

        {/* --- 공조 설비 관리 섹션 (tb_hvac_equip) --- */}
        <h2 style={{ marginTop: '40px', marginBottom: '15px', fontSize: '1.8em', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          공조 설비 관리
        </h2>
        <div className="device-list-container hvac-list-container">
          <table>
            <thead>
              <tr>
                <th>ID </th>
                <th>타입 </th>
                <th>이름 </th>

                {/* <th>연결된 SD_IDX</th> */}
                <th>전원 </th>
                <th>작업 </th>
              </tr>
            </thead>
            <tbody>
              {hvacEquipments.map(eq => (
                <tr key={eq.he_idx} className={eq.he_power ? 'hvac-on' : 'hvac-off'}>
                  <td>{eq.he_idx}</td>
                  <td>{eq.he_type}</td>
                  <td>{eq.he_name}</td>

                  {/* <td>{eq.sd_idx !== null ? eq.sd_idx : '-'}</td> */}
                  <td>{eq.he_power ? 'ON' : 'OFF'}</td>
                  <td>
                    <label className={`switch table-switch ${eq.he_power ? 'is-on' : 'is-off'}`}>
                      <input
                        type="checkbox"
                        checked={eq.he_power}
                        onChange={() => handleHvacStatusToggle(eq)}
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