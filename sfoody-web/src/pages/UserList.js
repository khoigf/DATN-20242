import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';
import Sidebar from '../components/Sidebar';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const usersPerPage = 5;

  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API;

  // Debounce input search
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchUsers = (token, page = 1, keyword = '') => {
    fetch(`${BASE_URL}/admin/users?page=${page}&limit=${usersPerPage}&search=${encodeURIComponent(keyword)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUsers(data.users);
        setTotalUsers(data.total);
      });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || localStorage.getItem('role') !== 'admin') {
      navigate('/login');
      return;
    }
    fetchUsers(token, currentPage, debouncedSearch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, BASE_URL, currentPage, debouncedSearch]);

  const handleToggleStatus = async (userId, currentStatus) => {
    const token = localStorage.getItem('token');
    const newStatus = currentStatus === 1 ? 0 : 1;

    try {
      const res = await fetch(`${BASE_URL}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setUsers(prev =>
          prev.map(user =>
            user._id === userId ? { ...user, status: newStatus } : user
          )
        );
      }
    } catch (err) {
      console.error('Error updating user status:', err);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    const pages = [];

    const maxPageToShow = 5;
    let startPage = Math.max(currentPage - 2, 1);
    let endPage = Math.min(startPage + maxPageToShow - 1, totalPages);

    if (endPage - startPage < maxPageToShow - 1) {
      startPage = Math.max(endPage - maxPageToShow + 1, 1);
    }

    if (startPage > 1) {
      pages.push(<span key="start-ellipsis" className="page-ellipsis">...</span>);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-button ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      pages.push(<span key="end-ellipsis" className="page-ellipsis">...</span>);
    }

    return (
      <div className="pagination-container">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-arrow"
        >
          &laquo;
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-arrow"
        >
          &raquo;
        </button>
      </div>
    );
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <h2 className="admin-title">Danh sách người dùng</h2>

        <input
          type="text"
          placeholder="🔍 Tìm theo email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); // Reset về page 1 khi search
          }}
          className="search-input"
        />

        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.status === 1 ? 'Hoạt động' : 'Bị khóa'}</td>
                <td>
                  <button
                    onClick={() => handleToggleStatus(user._id, user.status)}
                    className={
                      user.status === 1 ? 'toggle-btn active' : 'toggle-btn inactive'
                    }
                  >
                    {user.status === 1 ? 'Tạm khóa' : 'Mở khóa'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {renderPagination()}
      </div>
    </div>
  );
}
