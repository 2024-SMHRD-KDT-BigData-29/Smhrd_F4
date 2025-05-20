// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import { loginAPI } from '../apiService'; // 실제 API 호출은 잠시 주석 처리

// 테스트용 Mock 사용자 정보 (API 연동 전 임시 사용)
const MOCK_USERS = {
  "admin": { password: "password", role: "admin", m_name: "관리자", com_name: "TestCompany" }, // 상세 정보 추가
  "user": { password: "password", role: "user", m_name: "사용자", com_name: "TestCompany" }
};

function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => { // async는 유지해도 괜찮습니다.
    setMessage('');
    setIsLoading(true);

    // --- API 호출 대신 Mock 로그인 로직 사용 ---
    const userCredentials = MOCK_USERS[username];

    if (userCredentials && userCredentials.password === password) {
      // localStorage에 가짜 토큰 저장 (선택 사항, 실제 API 연동 시에는 서버 토큰 사용)
      localStorage.setItem('authToken', 'fake-jwt-token-for-testing');

      const loggedInUser = { // API 응답의 user 객체 형식에 맞춰서 생성
        m_id: username,
        m_name: userCredentials.m_name,
        com_name: userCredentials.com_name,
        role: userCredentials.role
        // API 명세서에 있는 다른 user 필드들도 필요하다면 추가
      };

      onLoginSuccess(loggedInUser.role, loggedInUser); // App.js의 onLoginSuccess 호출
      navigate('/'); // 대시보드 홈으로 리디렉션
    } else {
      setMessage('아이디 또는 비밀번호가 올바르지 않습니다. (Mock)');
    }
    // --- Mock 로그인 로직 끝 ---

    /* --- 실제 API 호출 로직 (나중에 주석 해제) ---
    try {
      const response = await loginAPI({ m_id: username, m_pw: password });
      if (response.data && response.data.status === 'ok') {
        localStorage.setItem('authToken', response.data.token);
        const loggedInUser = response.data.user;
        onLoginSuccess(loggedInUser.role, loggedInUser);
        navigate('/');
      } else {
        setMessage(response.data.message || '로그인에 실패했습니다. (서버 응답 오류)');
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('로그인 중 오류가 발생했습니다. 네트워크 또는 서버 연결을 확인해주세요.');
      }
      console.error("Login error:", error.response || error);
    } finally {
      setIsLoading(false);
    }
    */
   setIsLoading(false); // Mock 로직 사용 시에도 finally 대신 여기에 위치
  };

  return (
    <div className="auth-container active">
      <div className="auth-box">
        <h1 className="auth-logo">Worklean</h1>
        <p className="auth-subtext">공기질 관리 시스템</p>
        <div className="auth-form">
          <input
            type="text"
            placeholder="아이디를 입력하세요"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter' && !isLoading) handleLogin(); }}
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter' && !isLoading) handleLogin(); }}
            disabled={isLoading}
          />
          <button onClick={handleLogin} disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
          {message && <p className="auth-message">{message}</p>}
          <Link to="/signup" style={{ display: 'block', marginTop: '15px', fontSize: '0.9em' }}>
            회원이 아니신가요? <span style={{color: 'var(--accent-blue)', fontWeight: '500'}}>회원가입</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;