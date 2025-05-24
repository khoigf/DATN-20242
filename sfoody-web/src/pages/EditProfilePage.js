import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/HomeSidebar';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';
import ToastNotification from '../components/ToastNotification';
import './HomePage.css';

export default function EditProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API;

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setFormData({
            username: data.username || '',
            email: data.email || '',
            bio: data.bio || '',
          });
          setAvatarPreview(data.avatar_url || '');
        }
      } catch (err) {
        console.error('Lỗi khi tải hồ sơ:', err);
        setToast('❌ Không thể tải thông tin hồ sơ.');
      }
    };

    fetchProfile();
  }, [BASE_URL, token]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('username', formData.username);
      payload.append('email', formData.email);
      payload.append('bio', formData.bio);
      if (avatarFile) {
        payload.append('avatar', avatarFile);
      }

      const res = await fetch(`${BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      if (res.ok) {
        setToast('✅ Cập nhật hồ sơ thành công!');
        setTimeout(() => navigate('/profile'), 2000);
      } else {
        setToast('❌ Có lỗi khi cập nhật hồ sơ.');
      }
    } catch (err) {
      console.error('Lỗi cập nhật:', err);
      setToast('❌ Đã xảy ra lỗi khi cập nhật hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
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
          <h2 className="feed-title">✏️ Chỉnh sửa hồ sơ</h2>
          <form onSubmit={handleSubmit} className="profile-form" encType="multipart/form-data">
            <label>
              Tên người dùng
              <input type="text" name="username" value={formData.username} onChange={handleChange} required maxLength={50} />
            </label>
            <label>
              Email
              <input type="email" name="email" value={formData.email} onChange={handleChange} required maxLength={100} />
            </label>
            <label>
              Ảnh đại diện (tải ảnh)
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  alt="Xem trước ảnh"
                  className="mt-2 w-24 h-24 object-cover rounded-full border"
                />
              )}
            </label>
            <label>
              Giới thiệu bản thân
              <textarea name="bio" rows="4" value={formData.bio} onChange={handleChange}></textarea>
            </label>
            <button type="submit" className="manage-btn" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        </div>

        <aside className="right-column hide-on-mobile">
          <h3 className="sidebar-title">Lưu ý</h3>
          <p>💡 Bạn có thể thay đổi tên, email, ảnh đại diện và mô tả cá nhân tại đây.</p>
        </aside>
      </main>

      {toast && <ToastNotification message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
