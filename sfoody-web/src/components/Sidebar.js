import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Flag, Home, LogOut } from 'lucide-react';
import '../pages/Admin.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active-link' : '';

  return (
    <aside className="admin-sidebar">
      <h2 className="admin-sidebar-title">S-Foody</h2>

      <nav className="admin-nav">
        <Link to="/admin" className={isActive('/admin')}>
          <LayoutDashboard size={18} style={{ marginRight: '8px' }} />
          Tổng quan
        </Link>
        <Link to="/admin/users" className={isActive('/admin/users')}>
          <Users size={18} style={{ marginRight: '8px' }} />
          Người dùng
        </Link>
        <Link to="/admin/posts" className={isActive('/admin/posts')}>
          <FileText size={18} style={{ marginRight: '8px' }} />
          Bài viết
        </Link>
        <Link to="/admin/reports" className={isActive('/admin/reports')}>
          <Flag size={18} style={{ marginRight: '8px' }} />
          Báo cáo
        </Link>
      </nav>

      <div className="admin-sidebar-footer">
        <Link to="/">
          <button className="home-btn">
            <Home size={16} style={{ marginRight: '6px' }} />
            Trang chủ
          </button>
        </Link>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={16} style={{ marginRight: '6px' }} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
