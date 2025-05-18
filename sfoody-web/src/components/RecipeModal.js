import React, { useEffect, useState } from 'react';
import './RecipeModal.css';
import ToastNotification from './ToastNotification';

export default function RecipeModal({ recipe: initialRecipe, onClose }) {
  const [recipe, setRecipe] = useState(initialRecipe);
  const [newComment, setNewComment] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [toast, setToast] = useState('');
  const [rating, setRating] = useState(5);
  const token = localStorage.getItem('token');
  const BASE_URL = process.env.REACT_APP_API;
  const comments = recipe.comments || [];

  // Fetch recipe detail on open
  const fetchRecipeDetail = async () => {
    try {
      const res = await fetch(`${BASE_URL}/recipes/${initialRecipe._id}`);
      const data = await res.json();
      setRecipe(data);
    } catch (error) {
      console.error(error);
      setToast('Không thể tải chi tiết công thức.');
    }
  };

  useEffect(() => {
    fetchRecipeDetail();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRecipe._id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setToast('Bạn cần đăng nhập để bình luận.');
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipe_id: recipe._id, content: newComment, rating })
      });

      if (!res.ok) {
        setToast('Gửi bình luận thất bại!');
        return;
      }

      setToast('Bình luận đã được gửi!');
      setNewComment('');
      setRating(5);
      await fetchRecipeDetail(); // Reload recipe to update comments + rating
    } catch (error) {
      console.error(error);
      setToast('Đã xảy ra lỗi.');
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setToast('Bạn cần đăng nhập để báo cáo.');
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipe_id: recipe._id, content: reportContent })
      });

      if (!res.ok) {
        setToast('Gửi báo cáo thất bại!');
        return;
      }

      setToast('Đã gửi báo cáo thành công.');
      setReportContent('');
      setShowReportForm(false);
    } catch (error) {
      console.error(error);
      setToast('Đã xảy ra lỗi khi báo cáo.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <img src={recipe.image_url || '/default-recipe.jpg'} alt={recipe.title} className="modal-image" />
        <h2 className="modal-title">{recipe.title}</h2>
        <p className="modal-author">Được đăng bởi: {recipe.user_id?.username || 'Ẩn danh'}</p>
        <p className="modal-description">{recipe.description}</p>

        <div className="modal-tags">
          <strong>Tags:</strong>{' '}
          {recipe.tags?.length
            ? recipe.tags.map(tag => tag.name).join(', ')
            : 'Không có'}
        </div>

        <div className="modal-ingredients">
          <h3>Nguyên liệu</h3>
          <ul>
            {recipe.ingredients?.length ? (
              recipe.ingredients.map((item, index) => (
                <li key={index}>
                  {item.name || 'Ẩn danh'} - {item.quantity}
                </li>
              ))
            ) : (
              <li>Không có nguyên liệu</li>
            )}
          </ul>
        </div>

        <div className="modal-instructions">
          <h3>Hướng dẫn</h3>
          <p>{recipe.instruction}</p>
        </div>

        {recipe.video_url && (
          <div className="modal-video">
            <h3>Video hướng dẫn</h3>
            <iframe
              width="100%"
              height="315"
              src={recipe.video_url}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}

        <div className="modal-info">
          <p><strong>Thời gian chuẩn bị:</strong> {recipe.prep_time} phút</p>
          <p><strong>Thời gian nấu:</strong> {recipe.cook_time} phút</p>
          <p><strong>Khẩu phần:</strong> {recipe.servings}</p>
        </div>

        <div className="modal-average-rating"> 
          <p><strong>Đánh giá trung bình: </strong>{recipe.averageRating? recipe.averageRating + ' ⭐' : 'Chưa có đánh giá'}</p>
        </div>

        <div className="report-section">
          <strong>Báo cáo công thức: </strong>
          <button className='report-btn' onClick={() => setShowReportForm(!showReportForm)}>
            {showReportForm ? 'Hủy' : 'Báo cáo'}
          </button>
          {showReportForm && (
            <form onSubmit={handleReportSubmit} className="report-form">
              <textarea
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
                placeholder="Lý do báo cáo..."
                required
              />
              <button type="submit">Gửi báo cáo</button>
            </form>
          )}
        </div>

        <div className="comment-section">
          <h3>Bình luận & Đánh giá</h3>
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận..."
              required
            />
            <div className="rating-group">
              <label>Đánh giá: </label>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map(r => (
                  <option key={r} value={r}>{r} ⭐</option>
                ))}
              </select>
            </div>
            <button type="submit">Gửi</button>
          </form>

          <div className="comments-list">
            {comments.length === 0 ? (
              <p>Chưa có bình luận nào.</p>
            ) : comments.map((c, i) => (
              <div key={i} className="comment-item">
                <div className="comment-header">
                  <strong>{c.user_id?.username || 'Ẩn danh'}</strong>
                  <span>({c.rating} ⭐): {c.content}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {toast && <ToastNotification message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
