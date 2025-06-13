import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  LogIn,
  UserPlus,
  LogOut,
  TextSelect,
  UserRoundCog,
  Settings,
  MenuSquareIcon,
} from 'lucide-react';
import './HomeSidebar.css';

export default function HomeSidebar({ isOpen, onClose, token, role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'home-active-link' : '';

  return (
    <aside className={`home-sidebar ${isOpen ? 'open' : ''}`}>
      <button className="home-close-btn" onClick={onClose}>×</button>
      <h2 className="home-sidebar-title">S-Foody</h2>

      <nav className="home-nav">
        <Link to="/" className={isActive('/')}>
          <Home size={18} style={{ marginRight: '8px' }} />
          Trang chủ
        </Link>
        <Link to="/search" className={isActive('/search')}>
          <Search size={18} style={{ marginRight: '8px' }} />
          Tìm kiếm
        </Link>
        {token && (
          <Link to="/recipes/manage" className={isActive('/recipes/manage')}>
            <TextSelect size={18} style={{ marginRight: '8px' }} />
            Quản lý bài viết
          </Link>
        )}
        {token && (
          <Link to="/meal-planner" className={isActive('/meal-planner')}>
            <MenuSquareIcon size={18} style={{ marginRight: '8px' }} />
            Tạo thực đơn
          </Link>
        )}
        {token && role === 'admin' && (
            <Link to="/admin" className={isActive('/admin')}>
                <UserRoundCog size={18} style={{ marginRight: '8px' }} />
                Trang Admin
            </Link>
        )}
        {token && (
          <Link to="/settings" className={isActive('/settings')}>
            <Settings size={18} style={{ marginRight: '8px' }} />
            Cài đặt
          </Link>
        )}
      </nav>

      <div className="home-sidebar-footer">
        {!token ? (
          <>
            <Link to="/login">
              <button className="home-home-btn">
                <LogIn size={16} style={{ marginRight: '6px' }} />
                Đăng nhập
              </button>
            </Link>
            <Link to="/register">
              <button className="home-home-btn">
                <UserPlus size={16} style={{ marginRight: '6px' }} />
                Đăng ký
              </button>
            </Link>
          </>
        ) : (
          <button onClick={handleLogout} className="home-logout-btn">
            <LogOut size={16} style={{ marginRight: '6px' }} />
            Đăng xuất
          </button>
        )}
      </div>
    </aside>
  );
}
