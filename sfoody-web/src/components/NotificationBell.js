import React, { useEffect, useRef, useState } from 'react';
import { Bell, Trash2, RefreshCcw } from 'lucide-react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

const SOCKET_URL = process.env.REACT_APP_SOCKET;
const API_URL = process.env.REACT_APP_API;

export default function NotificationBell({ token, enabled }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);
  const fetchNotifications = async () => {
    let isEnabled = localStorage.getItem('notificationsEnabled');
    isEnabled = isEnabled === 'true' || isEnabled === null; // Default to true if not set
    setLoading(true);
    if (!isEnabled) {
      console.log('🔔 Disable Notification');
      setNotifications([]);
      setLoading(false);
    }else {
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('📥 Notifications fetched:', data);
      if (data.msg === "Token không hợp lệ") {
        console.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi khi tải thông báo:', err);
    } finally {
      setLoading(false);
    }
  }
  };

  useEffect(() => {
    if (token) fetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token || !enabled) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        console.log('📴 Socket disconnected');
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('notification', (data) => {
      setNotifications(prev => [data, ...prev]);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket error:', err.message);
    });

    return () => {
      socket.disconnect();
      console.log('📴 Socket disconnected');
    };
  }, [token, enabled]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Lỗi đánh dấu đã đọc:', err);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
    await Promise.all(unreadIds.map(id => markAsRead(id)));
  };

  const deleteNotification = async (id) => {
    try {
      await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Lỗi xóa thông báo:', err);
    }
  };

  const formatTime = (isoDate) =>
    new Date(isoDate).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const toggleDropdown = () => setShowDropdown(prev => !prev);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="notification-container" ref={dropdownRef}>
      <button className="bell-btn" onClick={toggleDropdown}>
        <Bell />
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h4>Thông báo</h4>
            <div className="dropdown-actions">
              <RefreshCcw size={18} onClick={fetchNotifications} title="Tải lại" />
              <button onClick={markAllAsRead}>Đánh dấu đã đọc</button>
            </div>
          </div>

          {loading ? (
            <p>Đang tải...</p>
          ) : notifications.length === 0 ? (
            <p>Không có thông báo</p>
          ) : (
            <ul>
              {notifications.map(n => (
                <li
                  key={n._id}
                  className={n.isRead ? 'read' : 'unread'}
                  onClick={() => markAsRead(n._id)}
                >
                  <div className="notification-message">
                    <p>{n.message}</p>
                    <small>{formatTime(n.createdAt)}</small>
                  </div>
                  <Trash2
                    size={16}
                    className="delete-icon"
                    title="Xóa"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n._id);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
