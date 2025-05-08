import React from 'react';
import { useSearchParams } from 'react-router-dom';
import './AuthPage.css';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [message, setMessage] = React.useState('Đang xác minh...');
  const BASE_URL = process.env.REACT_APP_API || '';

  React.useEffect(() => {
    fetch(`${BASE_URL}/auth/verify?token=${token}`)
      .then(res => res.json())
      .then(data => {
        setMessage(data.message || 'Xác minh thành công')
        if (data.success) {
          setTimeout(() => window.location.href = '/login', 1500); // Chuyển hướng sau 1.5 giây
        }})
      .catch(() => setMessage('Lỗi xác minh.')); 
  }, [BASE_URL, token]);

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Xác minh Email</h2>
        <p>{message}</p>
      </div>
    </div>
  );
}