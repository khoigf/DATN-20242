import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/HomeSidebar';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';
import './HomePage.css';

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notificationsEnabled') !== 'false';
  });

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      localStorage.setItem('darkMode', !prev);
      return !prev;
    });
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('notificationsEnabled', newValue);
      return newValue;
    });
  };

  return (
    <div className="home-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} token={token} role={role} />

      <header className="sticky-header">
        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        <div className="brand-area">
          <Link to="/" className="logo">
            <img src="/logo.png" alt="S-Foody" width={50} height={50} />
          </Link>
          <div className="text-group">
            <h1 className="title">S-Foody</h1>
            <p className="subtitle">Hôm nay ăn gì?</p>
          </div>
        </div>
        <div className="auth-actions">
          {token && (
            <>
              <UserMenu onLogout={handleLogout} />
              <NotificationBell token={token} enabled={notificationsEnabled} />
            </>
          )}
        </div>
      </header>

      <main className="feed-main">
        <div className="feed-column">
          <h2 className="feed-title">⚙️ Cài đặt</h2>
          <div className="settings-section">
            <div className="settings-item">
              <span>🌗 Chế độ tối</span>
              <label className="switch">
                <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
                <span className="slider round"></span>
              </label>
            </div>
            <div className="settings-item">
              <span>🔔 Nhận thông báo</span>
              <label className="switch">
                <input type="checkbox" checked={notificationsEnabled} onChange={toggleNotifications} />
                <span className="slider round"></span>
              </label>
            </div>
            <div className="settings-item">
              <Link to="/edit-profile" className="manage-btn">Chỉnh sửa hồ sơ</Link>
            </div>
            <div className="settings-item">
              <button className="manage-btn" onClick={handleLogout}>Đăng xuất</button>
            </div>
          </div>
        </div>

        <aside className="right-column hide-on-mobile">
          <h3 className="sidebar-title">Mẹo nhỏ</h3>
          <p>📱 Truy cập trang này dễ dàng trên thiết bị di động!</p>
        </aside>
      </main>
    </div>
  );
}
