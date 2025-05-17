import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, FileText } from 'lucide-react';
import './UserMenu.css';

export default function UserMenu({ onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => setOpen(prev => !prev);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    onLogout(); // Clear token, etc.
    navigate('/login');
  };

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button className="user-icon-btn" onClick={toggleMenu}>
        <User size={20} />
      </button>

      {open && (
        <div className="user-menu-dropdown">
          <Link to="/profile" className="menu-item">
            <User size={16} /> <span>Trang cá nhân</span>
          </Link>
          <Link to="/recipes/manage" className="menu-item">
            <FileText size={16} /> <span>Quản lý bài viết</span>
          </Link>
          <button onClick={handleLogout} className="menu-item logout-menu-btn">
            <LogOut size={16} /> <span>Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
}
