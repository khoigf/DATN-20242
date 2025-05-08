import React, { useEffect, useState } from 'react';
import './RecipeModal.css';

export default function RecipeModal({ recipeId, onClose }) {
  const [recipe, setRecipe] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [, setUser] = useState(null);

  const BASE_URL = process.env.REACT_APP_API;
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!recipeId) return;

    // Fetch chi tiết công thức
    fetch(`${BASE_URL}/recipes/${recipeId}`)
      .then(res => res.json())
      .then(setRecipe)
      .catch(console.error);

    // Fetch bình luận
    fetch(`${BASE_URL}/comments/recipe/${recipeId}`)
      .then(res => res.json())
      .then(setComments)
      .catch(console.error);

    // Fetch user info nếu đã đăng nhập
    if (token) {
      fetch(`${BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(setUser)
        .catch(console.error);
    }
  }, [BASE_URL, recipeId, token]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const res = await fetch(`${BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content: newComment, recipe: recipeId })
    });

    const data = await res.json();
    setComments(prev => [data, ...prev]);
    setNewComment('');
  };

  if (!recipe) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={e => e.stopPropagation()}>
        <button className="btn-close" onClick={onClose}>✖</button>
        <h2>{recipe.title}</h2>
        <img src={recipe.image_url || '/default-recipe.jpg'} alt={recipe.title} className="recipe-image" />
        <p className="recipe-description">{recipe.description}</p>

        <hr />
        <h4>Bình luận ({comments.length})</h4>
        <div className="comment-section">
          {comments.map(c => (
            <div key={c._id} className="comment">
              <strong>{c.user?.name || 'Ẩn danh'}:</strong> {c.content}
            </div>
          ))}
        </div>

        {token && (
          <form onSubmit={handleSubmitComment} className="comment-form">
            <textarea
              placeholder="Viết bình luận..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              required
            />
            <button type="submit" className="btn-submit-comment">Gửi bình luận</button>
          </form>
        )}
        {!token && <p className="comment-note">🛈 Vui lòng đăng nhập để bình luận.</p>}
      </div>
    </div>
  );
}
