import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';
import Sidebar from '../components/Sidebar';

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const postsPerPage = 5;
  const navigate = useNavigate(); 
  const BASE_URL = process.env.REACT_APP_API;

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timeout);
  }, [search]);

  // Fetch posts
  const fetchPosts = (token, page = 1, keyword = '') => {
    fetch(`${BASE_URL}/admin/posts?page=${page}&limit=${postsPerPage}&search=${encodeURIComponent(keyword)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setPosts(data.posts);
        setTotalPosts(data.total);
      });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || localStorage.getItem('role') !== 'admin') {
      navigate('/login');
      return;
    }
    fetchPosts(token, currentPage, debouncedSearch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, BASE_URL, currentPage, debouncedSearch]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${BASE_URL}/admin/posts/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: currentStatus === 1 ? 0 : 1 })
      });
      if (res.ok) {
        const updated = await res.json();
        setPosts(posts.map(p => (p._id === id ? updated : p)));
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const openModal = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/admin/posts/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setSelectedPost(data);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedPost(null);
    setShowModal(false);
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <h2 className="admin-title">Danh sách bài viết</h2>

        <input
          type="text"
          placeholder="🔍 Tìm kiếm theo tiêu đề..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); // Reset về trang 1 khi search
          }}
          className="search-input"
        />

        <table className="admin-table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Tác giả</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post._id}>
                <td>{post.title}</td>
                <td>{post.status === 1 ? post.user_id?.username : 'Ẩn'}</td>
                <td>{post.status === 1 ? 'Hoạt động' : 'Ẩn'}</td>
                <td className='td-actions'>
                  <button
                    onClick={() => handleToggleStatus(post._id, post.status)}
                    className={`btn-status ${post.status === 1 ? 'btn-hide' : 'btn-show'}`}
                  >
                    {post.status === 1 ? 'Ẩn' : 'Hiện'}
                  </button>
                  <button
                    onClick={() => openModal(post._id)}
                    className="btn-view"
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          {Array.from({ length: Math.ceil(totalPosts / postsPerPage) }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={currentPage === i + 1 ? 'active' : 'inactive'}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {showModal && selectedPost && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={closeModal}>×</button>
              <h3>{selectedPost.title}</h3>
              <p><strong>Tác giả:</strong> {selectedPost.status === 1 ? selectedPost.user_id?.username : 'Ẩn'}</p>
              <p><strong>Mô tả:</strong> {selectedPost.description}</p>
              <p><strong>Hướng dẫn:</strong> {selectedPost.instruction}</p>
              <p><strong>Thời gian chuẩn bị:</strong> {selectedPost.prep_time} phút</p>
              <p><strong>Thời gian nấu:</strong> {selectedPost.cook_time} phút</p>
              <p><strong>Khẩu phần:</strong> {selectedPost.servings}</p>
              <p><strong>Hình ảnh:</strong>{selectedPost.image_url && (
                <img src={selectedPost.image_url} alt="recipe" className="modal-img" />
              )}</p>
              <p><strong>Video:</strong>{selectedPost.video_url && (
                <video controls className="modal-video">
                  <source src={selectedPost.video_url} type="video/mp4" />
                  Trình duyệt không hỗ trợ video.
                </video>
              )}</p>
              <p><strong>Đánh giá trung bình:</strong> {selectedPost.averageRating ? `${selectedPost.averageRating} ⭐` : 'Chưa có đánh giá'}</p>
              <div className="modal-comments">
                <h4>Bình luận:</h4>
                {selectedPost.comments?.length > 0 ? selectedPost.comments.map((cmt, index) => (
                  <div key={index} className="comment-item">
                    <p><strong>{cmt.user_id?.username}:</strong> {cmt.content}</p>
                    <p>⭐ {cmt.rating} điểm</p>
                    <p className="comment-date">{new Date(cmt.created_at).toLocaleString()}</p>
                  </div>
                )) : <p>Chưa có bình luận.</p>}
              </div>                            
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
