import React, { useState } from 'react';
import './AuthPage.css';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const BASE_URL = process.env.REACT_APP_API || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    setMessage(data.message || 'Nếu email tồn tại, bạn sẽ nhận được liên kết khôi phục');
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Quên mật khẩu</h2>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Nhập email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button type="submit">Gửi yêu cầu</button>
          <div className="auth-link">
            <Link to="/login">← Quay lại đăng nhập</Link>
          </div>
        </form>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}