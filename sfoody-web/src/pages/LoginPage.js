import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AuthPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API;

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role);
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setMessage(data.msg || 'Lỗi đăng nhập');
      }
    } catch (error) {
      setMessage('Lỗi hệ thống. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Đăng nhập</h2>
        {message && <p className="auth-message">{message}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button type="submit">Đăng nhập</button>
          <div className="auth-link">
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>
          <div className="auth-link">
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          </div>
          <div className="auth-link">
            <Link to="/">← Quay lại trang chủ</Link>
          </div>
        </form>
      </div>
    </div>
  );
}