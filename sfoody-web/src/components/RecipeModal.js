import React, { useEffect, useState } from 'react';
import './RecipeModal.css';

export default function RecipeModal({ recipe, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const token = localStorage.getItem('token');
  const BASE_URL = process.env.REACT_APP_API;

  useEffect(() => {
    fetch(`${BASE_URL}/comments/recipe/${recipe._id}`)
      .then(res => res.json())
      .then(data => setComments(data));
  }, [recipe._id, BASE_URL]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!token) return alert('Bạn cần đăng nhập để bình luận.');

    const res = await fetch(`${BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ recipe_id: recipe._id, content: newComment, rating })
    });

    const newEntry = await res.json();
    setComments([newEntry, ...comments]);
    setNewComment('');
    setRating(5);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <img src={recipe.image_url || '/default-recipe.jpg'} alt={recipe.title} className="modal-image" />
        <h2 className="modal-title">{recipe.title}</h2>
        <p className="modal-description">{recipe.description}</p>
        <div className="modal-instructions">
          <h3>Hướng dẫn</h3>
          <p>{recipe.instruction}</p>
        </div>
        <div className="modal-video">
          <h3>Video hướng dẫn</h3>
          {recipe.video_url && (
            <iframe
              width="100%"
              height="315"
              src={recipe.video_url}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          )}
        </div>
        <div className="modal-info">
          <p><strong>Thời gian chuẩn bị:</strong> {recipe.prep_time} phút</p>
          <p><strong>Thời gian nấu:</strong> {recipe.cook_time} phút</p>
          <p><strong>Khẩu phần:</strong> {recipe.servings}</p>
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
                  <option key={r} value={r}>{r} ★</option>
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
                  <span>({c.rating} ★) : {c.content}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
