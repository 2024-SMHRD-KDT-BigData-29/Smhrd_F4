// src/pages/SignUpPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { signupAPI } from '../apiService'; // 실제 API 호출 함수 (apiService.js에 정의 예정)
// import './SignUpPage.css'; // SignUpPage만의 별도 CSS가 필요하다면

const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    m_id: '',          // 관리자 아이디 (DB: m_id)
    m_pw: '',          // 관리자 비밀번호 (DB: m_pw)
    m_confirm_pw: '',  // 비밀번호 확인 (UI 전용)
    m_name: '',        // 관리자명 (DB: m_name)
    m_tel: '',         // 관리자 전화번호 (DB: m_tel)
    charge_line: '',   // 담당라인 (DB: charge_line)
    com_name: '',      // 기업명 (DB: com_name)
    m_position: '',    // 직책 (DB: m_position)
    start_date: '',    // 입사일 (DB: start_date, DATETIME 형식)
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
    setMessage(''); // 이전 메시지 초기화

    if (formData.m_pw !== formData.m_confirm_pw) {
      setMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    // API로 전송할 데이터 (m_confirm_pw 필드 제외)
    const payload = {
      m_id: formData.m_id,
      m_pw: formData.m_pw,
      m_name: formData.m_name,
      m_tel: formData.m_tel,
      charge_line: formData.charge_line,
      com_name: formData.com_name,
      m_position: formData.m_position,
      // start_date 형식 처리: API 명세서 예시는 'YYYY-MM-DDTHH:mm:ss'
      // HTML input type="date"는 'YYYY-MM-DD'를 반환
      // 백엔드와 협의하여 'YYYY-MM-DD'만 보내도 되는지, 아니면 시간 추가 필요한지 확인
      // 여기서는 'T00:00:00'을 추가하여 DATETIME 형식으로 맞춤 (백엔드 처리 방식에 따라 변경 가능)
      start_date: formData.start_date ? `${formData.start_date}T00:00:00` : null,
    };

    // start_date가 DB에서 NN(Not Null)이고, 사용자가 입력 안 했을 경우 처리
    if (!formData.start_date && payload.start_date === null) {
        // 백엔드가 start_date: null을 어떻게 처리하는지 확인 필요.
        // 또는 프론트에서 '입사일을 입력해주세요' 메시지 표시 후 return;
        // setMessage('입사일을 입력해주세요.');
        // return;
    }

    setIsLoading(true);
    try {
      // --- 실제 API 호출 로직 (주석 해제 및 apiService.js에 signupAPI 함수 구현 필요) ---
      // const response = await signupAPI(payload);
      // if (response.data && response.data.status === 'ok') {
      //   alert(response.data.message || '회원가입이 성공적으로 완료되었습니다. 로그인 페이지로 이동합니다.');
      //   navigate('/login'); // 로그인 페이지로 리디렉션
      // } else {
      //   // API 응답은 성공했으나, 백엔드에서 보낸 에러 메시지 (예: ID 중복)
      //   setMessage(response.data.message || '회원가입에 실패했습니다. 입력 정보를 확인해주세요.');
      // }
      // --- ---

      // --- Mock 동작 (API 연동 전 테스트용) ---
      console.log('회원가입 데이터 (API 전송용):', payload);
      alert('회원가입 요청이 전송되었습니다. (실제 백엔드 연동 필요)\n로그인 페이지로 이동합니다.');
      navigate('/login');
      // --- ---

    } catch (error) { // 네트워크 에러 또는 API 서버가 4xx/5xx 에러 응답 시
      console.error('회원가입 실패:', error.response ? error.response.data : error.message);
      setMessage(error.response?.data?.message || '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container active"> {/* App.css 스타일 재활용 */}
      <div className="auth-box" style={{ maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', padding: '30px 40px' }}> {/* 스타일 약간 조정 */}
        <h1 className="auth-logo">Worklean</h1>
        <p className="auth-subtext" style={{ marginBottom: '25px' }}>회원가입</p>
        <form onSubmit={handleSubmit} className="auth-form signup-form"> {/* App.css의 스타일 재활용 */}
          {/* 각 input 필드는 App.css의 .auth-form input 및 .signup-form input 스타일 적용 */}
          <input type="text" name="m_id" placeholder="아이디" value={formData.m_id} onChange={handleChange} required />
          <input type="password" name="m_pw" placeholder="비밀번호" value={formData.m_pw} onChange={handleChange} required />
          <input type="password" name="m_confirm_pw" placeholder="비밀번호 확인" value={formData.m_confirm_pw} onChange={handleChange} required />
          <input type="text" name="m_name" placeholder="관리자명" value={formData.m_name} onChange={handleChange} required />
          <input type="tel" name="m_tel" placeholder="전화번호 (예: 010-1234-5678)" value={formData.m_tel} onChange={handleChange} required />
          <input type="text" name="charge_line" placeholder="담당 라인" value={formData.charge_line} onChange={handleChange} required />
          <input type="text" name="com_name" placeholder="기업명" value={formData.com_name} onChange={handleChange} required />
          <input type="text" name="m_position" placeholder="직책" value={formData.m_position} onChange={handleChange} required />

          {/* 날짜 입력 필드는 이전 답변의 CSS 스타일링과 함께 사용 */}
          <div className="date-input-wrapper">
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className={formData.start_date ? '' : 'date-placeholder-active'}
              data-placeholder="입사일"
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