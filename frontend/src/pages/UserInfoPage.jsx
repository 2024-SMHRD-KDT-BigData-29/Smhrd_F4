// src/pages/UserInfoPage.jsx
import React, { useEffect, useState } from 'react';

function UserInfoPage() {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token'); // JWT 토큰을 localStorage에서 가져옴
        const response = await fetch('http://192.168.219.193:8000/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        setUserInfo(result);
      } catch (err) {
        console.error(err);
        setError('사용자 정보를 불러오지 못했습니다.');
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <div className="user-info-page" style={{ padding: '20px' }}>
      <h2>사용자 정보</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {userInfo ? (
        <table>
          <tbody>
            <tr><td><strong>아이디</strong></td><td>{userInfo.user_id}</td></tr>
            <tr><td><strong>이름</strong></td><td>{userInfo.name}</td></tr>
            <tr><td><strong>전화번호</strong></td><td>{userInfo.tel}</td></tr>
            <tr><td><strong>소속 라인</strong></td><td>{userInfo.charge_line}</td></tr>
            <tr><td><strong>직책</strong></td><td>{userInfo.position}</td></tr>
            <tr><td><strong>회사</strong></td><td>{userInfo.company}</td></tr>
            <tr><td><strong>입사일</strong></td><td>{userInfo.start_date}</td></tr>
            <tr><td><strong>권한</strong></td><td>{userInfo.role}</td></tr>
          </tbody>
        </table>
      ) : (
        !error && <p>정보를 불러오는 중...</p>
      )}
    </div>
  );
}

export default UserInfoPage;
