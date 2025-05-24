import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/HomeSidebar';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';
import './HomePage.css';

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
    // Bạn có thể cập nhật thêm logic lưu trạng thái dark mode ở localStorage hoặc context
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
    // Có thể gọi API lưu cài đặt notification nếu cần
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
              <NotificationBell token={token} />
            </>
          )}
        </div>
      </header>

      <main className="feed-main">
        <div className="feed-column">
          <h2 className="feed-title">⚙️ Cài đặt</h2>
          <div className="settings-section">
            <label className="settings-item">
              <span>🌗 Chế độ tối</span>
              <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
            </label>
            <label className="settings-item">
              <span>🔔 Nhận thông báo</span>
              <input type="checkbox" checked={notificationsEnabled} onChange={toggleNotifications} />
            </label>
            <div className="settings-item">
              <Link to="/edit-profile" className="manage-btn">✏️ Chỉnh sửa hồ sơ</Link>
            </div>
            <div className="settings-item">
              <button className="manage-btn" onClick={handleLogout}>🚪 Đăng xuất</button>
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
