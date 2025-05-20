// src/App.js
import React, { useState } from 'react'; // useState import 확인!
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

  const handleLogin = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    console.log("App.js: Logged in with role -", role);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
  };

  return (
    <Router> {/* Router 사용 확인! */}
      {isLoggedIn ? (
        <div className="app-container">
          <Sidebar onLogout={handleLogout} userRole={userRole} /> {/* Sidebar 사용 확인! */}
          <main className="main-content">
            <Routes> {/* Routes 사용 확인! */}
              <Route path="/" element={<Navigate replace to="/dashboard" />} /> {/* Route, Navigate 사용 확인! */}
              <Route path="/dashboard" element={<DashboardPage userRole={userRole} />} /> {/* DashboardPage 사용 확인! */}
              <Route path="/anomaly-history" element={<AnomalyHistoryPage />} /> {/* AnomalyHistoryPage 사용 확인! */}
               {userRole === 'admin' && (
                <Route path="/device-management" element={<DeviceManagementPage />} />
              )}

              <Route path="*" element={<Navigate replace to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      ) : (
        <Routes> {/* Routes 사용 확인! */}
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLogin} />} /> {/* LoginPage 사용 확인! */}
          <Route path="/signup" element={<SignUpPage />} /> {/* 회원가입 페이지 라우트 추가 */}
          <Route path="*" element={<Navigate replace to="/login" />} /> {/* Navigate 사용 확인! */}
        </Routes>
      )}
    </Router>
  );
}

export default App;