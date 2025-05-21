// src/pages/LoginPage.jsx
import React, { useState } from 'react'; // React와 useState import
import { useNavigate, Link } from 'react-router-dom'; // useNavigate와 Link import
import { loginAPI } from '../apiService'; // loginAPI import (경로를 실제 위치에 맞게 수정하세요. 예: '../api/apiService')

function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate(); // useNavigate hook 사용
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setMessage('');
    setIsLoading(true);

    try {
      // API 요청 시에는 명세서에 맞는 키 이름 사용
      const response = await loginAPI({ m_id: username, m_pw: password });

      if (response.data && response.data.status === 'ok') {
        localStorage.setItem('authToken', response.data.token);

        const loggedInUser = response.data.user;

        // App.js의 onLoginSuccess에 사용자 정보 전달
        onLoginSuccess(loggedInUser.role, loggedInUser); // App.js의 handleLogin이 두 번째 인자로 사용자 객체를 받도록 수정 권장

        navigate('/'); // 대시보드 홈으로 리디렉션 (App.js에서 /dashboard로 추가 리디렉션 될 수 있음)
      } else {
        // API 응답은 성공(2xx)했으나, status가 'ok'가 아닌 경우 (예: 백엔드에서 보낸 에러 메시지)
        setMessage(response.data.message || '로그인에 실패했습니다. (서버 응답 오류)');
      }
    } catch (error) {
      // 네트워크 에러 또는 API 서버가 4xx/5xx 에러를 응답한 경우
      if (error.response && error.response.data && error.response.data.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('로그인 중 오류가 발생했습니다. 네트워크 또는 서버 연결을 확인해주세요.');
      }
      console.error("Login error:", error.response || error);
    } finally {
      setIsLoading(false);
    }
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