// src/components/dashboard/Sidebar.js

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; // Link 대신 NavLink를 사용하면 active 스타일링이 용이합니다.


// activeMenu, setActiveMenu prop은 NavLink를 사용하면 필요 없어질 수 있습니다.
// 여기서는 일단 제거하고 NavLink의 기능을 활용하는 것으로 가정합니다.
function Sidebar({ userRole, onLogout }) {
  const navigate = useNavigate(); // 로그아웃 후 페이지 이동 등에 사용 가능

  // '시스템 설정' 클릭 핸들러 (만약 페이지 이동이 아니라면 현재 방식 유지)
  const handleSettingsClick = (e) => {
    e.preventDefault();
    alert('시스템 설정 클릭됨 (구현 예정)');
    // 또는 navigate('/settings'); 등으로 페이지 이동을 원한다면 NavLink로 변경
  };

  // 로그아웃 처리
  const handleLogoutClick = (e) => {
    e.preventDefault();
    if (onLogout) {
      onLogout(); // 부모의 로그아웃 함수 실행
    }
    // 필요시 navigate('/login'); 등으로 로그인 페이지로 리디렉션
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/dashboard" className="logo-link"> {/* 로고 클릭 시 대시보드로 */}
          <span className="logo-icon"><i className="fas fa-industry"></i></span>
          <h1>Worklean</h1>
        </NavLink>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {/*
            NavLink는 현재 경로와 to prop이 일치하면 자동으로 active 클래스를 추가해줍니다.
            className prop에 함수를 전달하여 조건부 스타일링도 가능합니다.
            예: className={({ isActive }) => isActive ? 'active main-link' : 'main-link'}
          */}
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
              <i className="fas fa-tachometer-alt"></i> 대시보드
            </NavLink>
          </li>

          {/* userRole이 'admin'일 때만 '장치 관리' 메뉴를 보여줍니다. */}
          {userRole === 'admin' && (
            <li>
              <NavLink to="/device-management" className={({ isActive }) => isActive ? 'active' : ''}>
                <i className="fas fa-microchip"></i> 장치 관리
              </NavLink>
            </li>
          )}

          {/* "이상 탐지 이력" 메뉴 추가 */}
          <li>
            <NavLink to="/anomaly-history" className={({ isActive }) => isActive ? 'active' : ''}>
              <i className="fas fa-exclamation-triangle"></i> 이상 탐지 이력 {/* 아이콘 예시 */}
            </NavLink>
          </li>

          {/* 다른 메뉴들도 필요하다면 NavLink로 변경 (예: /reports, /settings 등) */}
          {/*
          <li>
            <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
              <i className="fas fa-chart-bar"></i> 보고서
            </NavLink>
          </li>
          */}
        </ul>
      </nav>
      <div className="sidebar-footer">
        {/* 시스템 설정이 페이지라면 NavLink로, 아니라면 현재 방식 유지 */}
        <a href="#" onClick={handleSettingsClick} className="footer-link">
          <i className="fas fa-cog"></i> 시스템 설정
        </a>
        <a href="#" onClick={handleLogoutClick} className="footer-link logout-link" style={{ marginTop: '10px', display: 'block', color: '#e74c3c' }}>
          <i className="fas fa-sign-out-alt"></i> 로그아웃
        </a>
      </div>
    </aside>
  );
}
// src/components/dashboard/Sidebar.js
// ...
// function Sidebar({ userRole, onLogout, currentUser }) { // currentUser prop 추가
// ...
//   return (
//     <aside className="sidebar">
//       <div className="sidebar-header">
//         <NavLink to="/dashboard" className="logo-link">
//           <span className="logo-icon"><i className="fas fa-industry"></i></span>
//           <h1>Worklean</h1>
//         </NavLink>
//         {/* currentUser가 있고, m_name 필드가 있다면 표시 */}
//         {currentUser && currentUser.m_name && (
//           <p style={{ color: 'var(--sidebar-text)', margin: '10px 0 0 0', textAlign: 'center', fontSize: '0.9em' }}>
//             {currentUser.m_name}님 ({currentUser.role})
//           </p>
//         )}
//       </div>
// ...




export default Sidebar;