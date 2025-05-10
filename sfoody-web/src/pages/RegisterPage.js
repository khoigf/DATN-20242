import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AuthPage.css';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // 👉 thêm state cho thông báo
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API || '';

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.msg);
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setMessage(data.msg || 'Đăng ký thất bại');
      }
    } catch (error) {
      setMessage('Lỗi hệ thống. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Đăng ký</h2>
        {message && (
          <p className="auth-message">{message}</p> // 👉 hiển thị thông báo
        )}
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Tên người dùng"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="current-name"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="current-email"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button type="submit">Đăng ký</button>
          <div className="auth-link">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
