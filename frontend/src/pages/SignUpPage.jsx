// src/pages/SignUpPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    m_id: '',
    m_pw: '',
    m_confirm_pw: '',
    m_name: '',
    m_tel: '', // 전화번호
    charge_line: '',
    com_name: '',
    m_position: '',
    start_date: '', // 입사일
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    if (formData.m_pw !== formData.m_confirm_pw) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }
    console.log('회원가입 데이터:', formData);
    alert('회원가입 요청이 전송되었습니다. (실제 처리 로직 필요)\n로그인 페이지로 이동합니다.');
    navigate('/login');
  };

  return (
    <div className="auth-container active">
      <div className="auth-box" style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h1 className="auth-logo">Worklean</h1>
        <p className="auth-subtext">회원가입</p>
        <form onSubmit={handleSubmit} className="auth-form signup-form">
          <input type="text" name="m_id" placeholder="아이디" value={formData.m_id} onChange={handleChange} required />
          <input type="password" name="m_pw" placeholder="비밀번호" value={formData.m_pw} onChange={handleChange} required />
          <input type="password" name="m_confirm_pw" placeholder="비밀번호 확인" value={formData.m_confirm_pw} onChange={handleChange} required />
          <input type="text" name="m_name" placeholder="관리자명" value={formData.m_name} onChange={handleChange} required />

          {/* 전화번호 필드: placeholder를 명확히 사용 */}
          <input
            type="tel"
            name="m_tel"
            placeholder="전화번호 (예: 010-1234-5678)"
            value={formData.m_tel}
            onChange={handleChange}
            required
          />

          <input type="text" name="charge_line" placeholder="담당 라인" value={formData.charge_line} onChange={handleChange} required />
          <input type="text" name="com_name" placeholder="기업명" value={formData.com_name} onChange={handleChange} required />
          <input type="text" name="m_position" placeholder="직책" value={formData.m_position} onChange={handleChange} required />

          {/* 입사일 필드: placeholder 대신 레이블을 사용하거나, CSS로 placeholder처럼 보이게 처리 */}
          {/* 아래는 CSS로 placeholder 효과를 내는 방식입니다. */}
          <div className="date-input-wrapper"> {/* 날짜 입력을 위한 래퍼 */}
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              data-placeholder="입사일" /* CSS에서 사용하기 위한 속성 */
              className={formData.start_date ? '' : 'date-placeholder-active'} /* 값이 없을 때 클래스 추가 */
            />
          </div>

          <button type="submit">회원가입 하기</button>
          {message && <p className="auth-message" style={{ color: message.includes('일치하지 않습니다') ? '#e74c3c' : 'green' }}>{message}</p>}
          <button type="button" onClick={() => navigate('/login')} style={{ marginTop: '10px', backgroundColor: '#6c757d' }}>
            로그인 페이지로 돌아가기
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;