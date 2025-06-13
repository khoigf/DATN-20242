import React, { useEffect, useState, useCallback } from 'react';
import './RecipeModal.css';
import ToastNotification from './ToastNotification';

export default function RecipeModal({ recipe: initialRecipe, onClose }) {
  const [recipe, setRecipe] = useState(initialRecipe);
  const [newComment, setNewComment] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [toast, setToast] = useState('');
  const [rating, setRating] = useState(5);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);

  const token = localStorage.getItem('token');
  const BASE_URL = process.env.REACT_APP_API;
  const comments = recipe.comments || [];

  // === Load recipe details ===
  const fetchRecipeDetail = async () => {
    try {
      const res = await fetch(`${BASE_URL}/recipes/${initialRecipe._id || initialRecipe.id}`);
      const data = await res.json();
      setRecipe(data);
    } catch (error) {
      console.error(error);
      setToast('Không thể tải chi tiết công thức.');
    }
  };

  // === Check if recipe is favorited by user ===
  const checkIfFavorite = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const found = data.find(f => f.recipe.id === (initialRecipe._id || initialRecipe.id));
      if (found) {
        setIsFavorite(true);
        setFavoriteId(found.id);
      } else {
        setIsFavorite(false);
        setFavoriteId(null);
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra yêu thích', error);
    }
  }, [BASE_URL, initialRecipe._id, initialRecipe.id, token]);

  useEffect(() => {
    fetchRecipeDetail();
    checkIfFavorite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRecipe._id, checkIfFavorite]);

  // === Toggle Favorite ===
  const toggleFavorite = async () => {
    if (!token) {
      setToast('Bạn cần đăng nhập để yêu thích công thức.');
      return;
    }

    try {
      if (isFavorite) {
        const res = await fetch(`${BASE_URL}/favorites/${favoriteId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        setToast('Đã xóa khỏi danh sách yêu thích.');
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        const res = await fetch(`${BASE_URL}/favorites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ recipeId: recipe._id }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setToast('Đã thêm vào danh sách yêu thích!');
        setIsFavorite(true);
        setFavoriteId(data._id);
      }
    } catch (error) {
      console.error(error);
      setToast('Thao tác yêu thích thất bại.');
    }
  };

  // === Submit Comment ===
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
      await fetchRecipeDetail(); // Cập nhật lại recipe để hiển thị comment mới
    } catch (error) {
      console.error(error);
      setToast('Đã xảy ra lỗi.');
    }
  };

  // === Submit Report ===
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

  // === Parse YouTube embed link ===
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/;
    const match = url.match(regex);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <button className="close-btn" onClick={onClose}>×</button>

      {/* Image */}
      <img src={recipe.image_url || '/default-recipe.jpg'} alt={recipe.title} className="modal-image" />
      {/* Title + Favorite Button */}
      <div className="modal-header">
        <h2 className="modal-title">{recipe.title}</h2>
        <button
          className={`favorite-btn ${isFavorite ? 'favorited' : ''}`}
          onClick={toggleFavorite}
        >
          {isFavorite ? '❤️ Bỏ yêu thích' : '🤍 Yêu thích'}
        </button>
      </div>
      <p className="modal-author">Được đăng bởi: {recipe.user_id?.username || 'Ẩn danh'}</p>
      <p className="modal-description">{recipe.description}</p>

      {/* Tags */}
      <div className="modal-tags">
        <strong>TAGS:</strong>{' '}
        {recipe.tags?.length ? recipe.tags.map(tag => tag.name).join(', ') : 'Không có'}
      </div>

      {/* Ingredients */}
      <section className="modal-ingredients">
        <h3>Nguyên liệu</h3>
        <ul>
          {recipe.ingredients?.length ? (
            recipe.ingredients.map((item, index) => (
              <li key={index}>{item.name || 'Ẩn danh'} - {item.quantity}</li>
            ))
          ) : (
            <li>Không có nguyên liệu</li>
          )}
        </ul>
      </section>

      {/* Instructions */}
      <section className="modal-instructions">
        <h3>Hướng dẫn</h3>
        <p>{recipe.instruction}</p>
      </section>

      {/* Video */}
      {recipe.video_url && (
        <section className="modal-video">
          <h3>Video hướng dẫn</h3>
          <iframe
            width="100%"
            height="315"
            src={getYoutubeEmbedUrl(recipe.video_url)}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </section>
      )}

      {/* Recipe Info */}
      <div className="modal-info">
        <p><strong>Thời gian chuẩn bị:</strong> {recipe.prep_time} phút</p>
        <p><strong>Thời gian nấu:</strong> {recipe.cook_time} phút</p>
        <p><strong>Khẩu phần:</strong> {recipe.servings}</p>
      </div>

      {/* Rating */}
      <div className="modal-average-rating">
        <p><strong>Đánh giá trung bình:</strong> {recipe.averageRating ? `${recipe.averageRating} ⭐` : 'Chưa có đánh giá'}</p>
      </div>

      {/* Report Form */}
      <section className="report-section">
        <strong>Báo cáo công thức: </strong>
        <button className="report-btn" onClick={() => setShowReportForm(!showReportForm)}>
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
      </section>

      {/* Comments */}
      <section className="comment-section">
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
          ) : (
            comments.map((c, i) => (
              <div key={i} className="comment-item">
                <div className="comment-header">
                  <strong>{c.user_id?.username || 'Ẩn danh'}</strong>
                  <span>({c.rating} ⭐): {c.content}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>

    {/* Toast */}
    {toast && <ToastNotification message={toast} onClose={() => setToast('')} />}
  </div>
  );
}
