// src/App.js
import React, { useState, useEffect } from 'react'; // useState import 확인!
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // React Router DOM import 확인!

// 🔧 컴포넌트 (Sidebar 등)
import Sidebar from "./components/dashboard/Sidebar";


// 🔧 페이지 (화면 단위)
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import AnomalyHistoryPage from "./pages/AnomalyHistoryPage";
import DeviceManagementPage from "./pages/DeviceManagementPage";
import UserInfoPage from './pages/UserInfoPage';

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
          const res = await fetch("http://localhost:8000/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const user = await res.json();
            handleLogin("admin", user);  // 또는 user.role이 있으면 그걸 넣어도 됨
          } else {
            handleLogout();  // 유효하지 않은 토큰이면 강제 로그아웃
          }
        } catch (error) {
          console.error("자동 로그인 실패:", error);
          handleLogout(); // 네트워크 등 에러 시도 강제 로그아웃
        }
      }
    };

    attemptAutoLogin(); // ✅ 주석 해제해서 실행되게 만듦
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
              {userRole === 'admin' && (
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
          <Route path="/user-info" element={<UserInfoPage />} />
        </Routes>
      )}
    </Router>
  );
}
export default App;