import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';
import Sidebar from '../components/Sidebar';

export default function ReportList() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [totalReports, setTotalReports] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [reasonModal, setReasonModal] = useState(false);
  const [currentReportId, setCurrentReportId] = useState(null);
  const [reason, setReason] = useState('');

  const reportsPerPage = 5;
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API;

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchReports = async (token, page = 1, keyword = '') => {
    try {
      const res = await fetch(`${BASE_URL}/admin/reports?page=${page}&limit=${reportsPerPage}&search=${encodeURIComponent(keyword)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setReports(data.reports);
      setTotalReports(data.total);
    } catch (err) {
      console.error('Fetch reports error:', err);
    }
  };

  const openReasonModal = (reportId) => {
    setCurrentReportId(reportId);
    setReason('');
    setReasonModal(true);
  };

  const closeReasonModal = () => {
    setReasonModal(false);
    setCurrentReportId(null);
  };


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && localStorage.getItem('role') !== 'admin') {
      navigate('/login');
      return;
    }
    fetchReports(token, currentPage, debouncedSearch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, BASE_URL, currentPage, debouncedSearch]);

  const handlePageChange = (newPage) => setCurrentPage(newPage);

  const handleUpdateStatus = async (id, status, reasonText = '') => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BASE_URL}/admin/reports/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, reason: reasonText })
      });
      if (res.ok) {
        const updated = await res.json();
        setReports(reports.map(r => (r._id === id ? updated : r)));
        closeReasonModal();
      }
    } catch (err) {
      console.error('Update report status error:', err);
    }
  };

  const openModal = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/admin/reports/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setSelectedReport(data);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedReport(null);
    setShowModal(false);
  };

  const renderStatusText = (status) => {
    if (status === 0) return 'Chưa xử lý';
    if (status === 1) return 'Đã ẩn bài';
    if (status === 2) return 'Không vi phạm';
    return 'Không rõ';
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(totalReports / reportsPerPage);
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
        <h2 className="admin-title">Danh sách báo cáo</h2>

        <input
          type="text"
          placeholder="🔍 Tìm kiếm nội dung báo cáo..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="search-input"
        />

        <table className="admin-table">
          <thead>
            <tr>
              <th>Người báo cáo</th>
              <th>Bài viết</th>
              <th>Nội dung</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report._id}>
                <td>{report.user_id?.username}</td>
                <td>{report.recipe_id?.title}</td>
                <td>{report.content}</td>
                <td>{renderStatusText(report.status)}</td>
                <td className="td-actions">
                  <button
                    onClick={() => openModal(report._id)}
                    className="btn-view"
                  >
                    Chi tiết
                  </button>
                  <button
                    onClick={() => openReasonModal(report._id)}
                    className="btn-hide"
                  >
                    Ẩn bài
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(report._id, 2)}
                    className="btn-show"
                  >
                    Không vi phạm
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {renderPagination()}

        {showModal && selectedReport && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={closeModal}>×</button>
              <h3>Chi tiết báo cáo</h3>
              <p><strong>Người báo cáo:</strong> {selectedReport.user_id?.username} ({selectedReport.user_id?.email})</p>
              <p><strong>Bài viết:</strong> {selectedReport.recipe_id?.title}</p>
              <p><strong>Nội dung:</strong> {selectedReport.content}</p>
              <p><strong>Trạng thái:</strong> {renderStatusText(selectedReport.status)}</p>
            </div>
          </div>
        )}
        {reasonModal && (
          <div className="modal-overlay" onClick={closeReasonModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={closeReasonModal}>×</button>
              <h3>Nhập lý do ẩn bài viết</h3>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="4"
                placeholder="Nhập lý do (ví dụ: Bài viết vi phạm nội dung)..."
                className="reason-textarea"
              />
              <button
                onClick={() => handleUpdateStatus(currentReportId, 1, reason)}
                className="btn-confirm"
              >
                Xác nhận ẩn bài
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
