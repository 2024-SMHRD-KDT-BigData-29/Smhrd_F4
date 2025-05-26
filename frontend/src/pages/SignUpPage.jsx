// src/pages/SignUpPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signupAPI } from '../apiService'; // ⭐ apiService.js에서 signupAPI 함수 import // ⭐ apiService.js에서 signupAPI 함수 import

const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    m_id: '',
    m_pw: '',
    m_confirm_pw: '',
    m_name: '',
    m_tel: '',
    charge_line: '',
    com_name: '',
    m_position: '',
    start_date: '',
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (formData.m_pw !== formData.m_confirm_pw) {
      setMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const payload = {
      m_id: formData.m_id,
      m_pw: formData.m_pw,
      m_name: formData.m_name,
      m_tel: formData.m_tel,
      charge_line: formData.charge_line,
      com_name: formData.com_name,
      m_position: formData.m_position,
      start_date: formData.start_date ? `${formData.start_date}T00:00:00` : null,
    };

    // start_date NN 제약조건 및 백엔드 처리 방식 확인 필요
    if (!formData.start_date && payload.start_date === null) {
      // 예: setMessage('입사일을 입력해주세요.'); return;
    }

    setIsLoading(true);
    try {
      // --- ⭐ 실제 API 호출 로직 ---
      const response = await signupAPI(payload); // apiService.js의 함수 사용

      if (response.data && response.data.status === 'ok') {
        alert(response.data.message || '회원가입이 성공적으로 완료되었습니다. 로그인 페이지로 이동합니다.');
        navigate('/login'); // 로그인 페이지로 리디렉션
      } else {
        // API 응답은 성공(2xx)했으나, 백엔드에서 보낸 에러 메시지 (예: ID 중복)
        setMessage(response.data.message || '회원가입에 실패했습니다. 입력 정보를 확인해주세요.');
      }
      // --- ---

    } catch (error) { // 네트워크 에러 또는 API 서버가 4xx/5xx 에러 응답 시
      console.error('회원가입 실패:', error.response ? error.response.data : error);
      setMessage(error.response?.data?.message || '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container active">
      <div className="auth-box" style={{ maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', padding: '30px 40px' }}>
        <h1 className="auth-logo">Worklean</h1>
        <p className="auth-subtext" style={{ marginBottom: '25px' }}>회원가입</p>
        <form onSubmit={handleSubmit} className="auth-form signup-form">
          <input type="text" name="m_id" placeholder="아이디" value={formData.m_id} onChange={handleChange} required disabled={isLoading} />
          <input type="password" name="m_pw" placeholder="비밀번호" value={formData.m_pw} onChange={handleChange} required disabled={isLoading} />
          <input type="password" name="m_confirm_pw" placeholder="비밀번호 확인" value={formData.m_confirm_pw} onChange={handleChange} required disabled={isLoading} />
          <input type="text" name="m_name" placeholder="관리자명" value={formData.m_name} onChange={handleChange} required disabled={isLoading} />
          <input type="tel" name="m_tel" placeholder="전화번호 (예: 010-1234-5678)" value={formData.m_tel} onChange={handleChange} required disabled={isLoading} />
          <input type="text" name="charge_line" placeholder="담당 라인" value={formData.charge_line} onChange={handleChange} required disabled={isLoading} />
          <input type="text" name="com_name" placeholder="기업명" value={formData.com_name} onChange={handleChange} required disabled={isLoading} />
          <input type="text" name="m_position" placeholder="직책" value={formData.m_position} onChange={handleChange} required disabled={isLoading} />

          <div className="date-input-wrapper">
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className={formData.start_date ? '' : 'date-placeholder-active'}
              data-placeholder="입사일"
              disabled={isLoading}
            />
          </div>

          <button type="submit" disabled={isLoading} style={{ marginTop: '5px' }}>
            {isLoading ? '가입 처리 중...' : '회원가입 하기'}
          </button>
          {message && <p className="auth-message" style={{ color: message.includes('일치하지 않습니다') || message.includes('실패') || message.includes('오류') ? '#e74c3c' : 'green' }}>{message}</p>}
          <button type="button" onClick={() => navigate('/login')} style={{ marginTop: '12px', backgroundColor: '#6c757d' }} disabled={isLoading}>
            로그인 페이지로 돌아가기
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;