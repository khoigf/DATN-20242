import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './AuthPage.css';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const BASE_URL = process.env.REACT_APP_API;

  const handleReset = async (e) => {
    e.preventDefault();
    const res = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password })
    });
    const data = await res.json();
    setMessage(data.message || 'Mật khẩu đã được cập nhật.');
    setMessage(data.msg);
    setTimeout(() => navigate('/login'), 1500);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Đặt lại mật khẩu</h2>
        <form onSubmit={handleReset}>
          <input type="password" placeholder="Mật khẩu mới" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">Đặt lại</button>
        </form>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}