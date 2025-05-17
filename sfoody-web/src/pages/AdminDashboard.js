import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';
import Sidebar from '../components/Sidebar';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && localStorage.getItem('role') !== 'admin') {
      navigate('/login');
      return;
    }

    // Lấy thông tin người dùng
    fetch(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 403) return navigate('/');
        return res.json();
      })
      .then(data => {
        setUser(data);
        if (data.role !== 'admin') {
          navigate('/');
        } else {
          // Lấy thống kê nếu là admin
          fetch(`${BASE_URL}/admin/summary`, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(data => setSummary(data))
            .catch(err => console.error('Lỗi lấy thống kê:', err));
        }
      })
      .catch(() => navigate('/'));
  }, [BASE_URL, navigate]);

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <h1 className="admin-title">Trang quản trị S-Foody</h1>
        {user && <p className="mt-2">Xin chào Admin: {user.username}</p>}
        <p className="admin-sub">Chào mừng bạn đến với bảng điều khiển quản trị viên.</p>
        <h3>Thống kê tổng quan</h3>
        <p className="admin-sub">Dưới đây là một số thông tin thống kê về người dùng và bài viết.</p>
        <p className="admin-sub">Bạn có thể quản lý người dùng và bài viết từ menu bên trái.</p>
        {summary && (
          <div className="admin-stats">
            <div className="stat-card">👤 Người dùng: {summary.users}</div>
            <div className="stat-card">📄 Bài viết: {summary.posts}</div>
            <div className="stat-card">🚫 Bài viết ẩn: {summary.hiddenPosts}</div>
            <div className="stat-card">📢 Báo cáo: {summary.reports}</div>
            <div className="stat-card">⏳ Chưa xử lý: {summary.pendingReports}</div>
          </div>
        )}
      </main>
    </div>
  );
}
