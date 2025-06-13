import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/HomeSidebar';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';
import ToastNotification from '../components/ToastNotification';
import './HomePage.css';

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('notificationsEnabled') !== 'false');
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const BASE_URL = process.env.REACT_APP_API;
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      document.body.setAttribute('data-theme', 'dark')
    } else {
      document.body.classList.remove('dark');
      document.body.removeAttribute('data-theme');
    }
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', newValue);
      return newValue;
    });
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('notificationsEnabled', newValue);
      return newValue;
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      });

      const data = await res.json();
      if (res.ok) {
        setToast('✅ Đổi mật khẩu thành công!');
        setPasswordData({ currentPassword: '', newPassword: '' });
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
      } else {
        setToast(`❌ ${data.message || 'Đổi mật khẩu thất bại.'}`);
      }
    } catch (err) {
      console.error('Password change error:', err);
      setToast('❌ Lỗi khi kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setPasswordData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="home-container">
                  <header className="header">
                    <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
                    <Link to="/"> 
                      <h1 className="header-title">S-Foody</h1>
                    </Link>
                    <div className="auth-actions">
                      {token ? (
                        <>
                          <UserMenu onLogout={handleLogout} />
                          <NotificationBell token={token} />
                        </>
                      ) : (
                        <>
                          <Link to="/login" className="login-button">Đăng nhập</Link>
                          <Link to="/register" className="login-button">Đăng ký</Link>
                        </>
                      )}
                    </div>
                  </header>
        
      <div className="home-content">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} token={token} role={role} />
        <main className="main-content">
          <h2 className="feed-title">⚙️ Cài đặt</h2>

          <div className="settings-options">
            <div className="settings-item">
              <label className="settings-label">
                🌗 Giao diện tối
                <label className="switch">
                  <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
                  <span className="slider round"></span>
                </label>
              </label>
            </div>

            <div className="settings-item">
              <label className="settings-label">
                🔔 Nhận thông báo
                <label className="switch">
                  <input type="checkbox" checked={notificationsEnabled} onChange={toggleNotifications} />
                  <span className="slider round"></span>
                </label>
              </label>
            </div>

            <div className="settings-item">
              <Link to="/edit-profile" className="manage-btn">✏️ Chỉnh sửa hồ sơ</Link>
            </div>
          </div>

          <h3 className="feed-title" style={{ marginTop: '2rem' }}>🔐 Đổi mật khẩu</h3>
          <form className="profile-form" onSubmit={handlePasswordChange} encType="multipart/form-data">
            <label>
              Mật khẩu hiện tại
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Mật khẩu mới
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handleInputChange}
                required
                minLength={6}
              />
            </label>
            <div className="button-group">
              <button type="submit" className="manage-btn" disabled={loading}>
                {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </button>
              <button type="button" className="cancel-btn" onClick={() => setPasswordData({ currentPassword: '', newPassword: '' })}>
                Hủy
              </button>
            </div>
          </form>
        </main>
      </div>
      {toast && <ToastNotification message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
