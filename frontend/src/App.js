// src/App.js
import React, { useState, useEffect } from 'react'; // useState import 확인!
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // React Router DOM import 확인!

import Sidebar from './components/dashboard/Sidebar'; // Sidebar import 확인!
import LoginPage from './pages/LoginPage'; // LoginPage import 확인!
import SignUpPage from './pages/SignUpPage'; // SignUpPage import 추가
import DashboardPage from './pages/DashboardPage'; // DashboardPage import 확인!
import AnomalyHistoryPage from './pages/AnomalyHistoryPage'; // AnomalyHistoryPage import 확인!
import DeviceManagementPage from './pages/DeviceManagementPage';

import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (role, userObject) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setCurrentUser(userObject); // ⭐ 사용자 정보 저장
    console.log("App.js: Logged in. Role:", role, "User:", userObject);
  };

  const handleLogout = async () => { // async 추가 (API 호출 대비)
    // setIsLoading(true); // 로딩 상태 추가 권장
    try {
      // await logoutAPI(); // apiService.js에 정의
      console.log('로그아웃 시도');
    } catch (error) {
      // console.error('로그아웃 실패:', error);
    } finally {
      localStorage.removeItem('authToken');
      setIsLoggedIn(false);
      setUserRole(null);
      setCurrentUser(null); // ⭐ 사용자 정보 초기화
      // navigate('/login'); // App.js에서는 navigate 직접 사용 어려움.
      // 로그아웃 후에는 아래 return 문의 삼항연산자에 의해 자동으로 로그인 페이지로 리디렉션됨.
      // setIsLoading(false);
    }
  };

   // (선택사항) 앱 로드 시 토큰 확인하여 자동 로그인 처리 로직
  useEffect(() => {
    const attemptAutoLogin = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // const response = await fetchMeAPI(); // /api/auth/me 호출 (apiService.js에 정의)
          // if (response.data && response.data.user) {
          //   handleLogin(response.data.user.role, response.data.user);
          // } else {
          //   handleLogout(); // 유효하지 않은 토큰이면 강제 로그아웃
          // }
        } catch (error) {
          // console.error('Auto login failed:', error);
          // handleLogout(); // 에러 발생 시 강제 로그아웃
        }
      }
    };
    // attemptAutoLogin(); // 실제 API 연동 시 주석 해제
  }, []);



 return (
    <Router>
      {isLoggedIn ? (
        <div className="app-container">
          {/* Sidebar에 currentUser 전달 (예: 사용자 이름 표시용) */}
          <Sidebar onLogout={handleLogout} userRole={userRole} currentUser={currentUser} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate replace to="/dashboard" />} />
              {/* DashboardPage 등에도 currentUser 전달 가능 */}
              <Route path="/dashboard" element={<DashboardPage userRole={userRole} currentUser={currentUser} />} />
              <Route path="/anomaly-history" element={<AnomalyHistoryPage />} />
              { (
                <Route path="/device-management" element={<DeviceManagementPage currentUser={currentUser} />} />
              )}
              <Route path="*" element={<Navigate replace to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLogin} />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="*" element={<Navigate replace to="/login" />} />
        </Routes>
      )}
    </Router>
  );
}
export default App;