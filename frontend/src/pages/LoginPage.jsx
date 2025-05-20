// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Link 추가

// LoginPage는 onLoginSuccess 함수를 props로 받습니다.
function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState(''); // 아이디 상태
  const [password, setPassword] = useState(''); // 비밀번호 상태
  const [message, setMessage] = useState('');

  // 실제로는 API 통신을 통해 사용자 정보를 확인해야 합니다.
  // 여기서는 데모용 하드코딩된 사용자 정보입니다.
  const MOCK_USERS = {
    "admin": { password: "password", role: "admin" },
    "user": { password: "password", role: "user" }
  };

  const handleLogin = () => {
    setMessage(''); // 이전 메시지 초기화
    const user = MOCK_USERS[username];

    if (user && user.password === password) {
      onLoginSuccess(user.role); // 부모(App.js)의 로그인 처리 함수 호출 (역할 전달)
      navigate('/'); // 대시보드로 이동 (App.js에서 /dashboard로 리디렉션)
    } else {
      setMessage('아이디 또는 비밀번호가 올바르지 않습니다.');
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
            onKeyPress={(e) => { if (e.key === 'Enter') handleLogin(); }}
          />
          <input
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') handleLogin(); }}
          />
          <button onClick={handleLogin}>로그인</button>
          {message && <p className="auth-message">{message}</p>}

          {/* 회원가입 버튼 추가 */}
          <Link to="/signup" style={{ display: 'block', marginTop: '15px', fontSize: '0.9em' }}>
            회원이 아니신가요? <span style={{color: 'var(--accent-blue)', fontWeight: '500'}}>회원가입</span>
          </Link>
          {/* 또는 버튼 형태로
          <button
            type="button" 
            onClick={() => navigate('/signup')}
            style={{ marginTop: '10px', backgroundColor: 'transparent', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)' }}
          >
            회원가입
          </button>
          */}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;