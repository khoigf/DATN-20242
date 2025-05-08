import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css'; // dùng chung CSS để đồng bộ
import RecipeModal from '../components/RecipeModal';

export default function ManageRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', image_url: '' });

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const BASE_URL = process.env.REACT_APP_API;

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetch(`${BASE_URL}/recipes/user`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setRecipes)
      .catch(console.error);
  }, [BASE_URL, token, navigate]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xoá bài viết này?')) return;

    await fetch(`${BASE_URL}/recipes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    setRecipes((prev) => prev.filter((r) => r._id !== id));
  };

  const openModal = (recipe = null) => {
    setEditingRecipe(recipe);
    setForm(recipe ? {
      title: recipe.title,
      description: recipe.description,
      image_url: recipe.image_url || '',
    } : { title: '', description: '', image_url: '' });
    setModalVisible(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingRecipe ? 'PUT' : 'POST';
    const url = editingRecipe
      ? `${BASE_URL}/recipes/${editingRecipe._id}`
      : `${BASE_URL}/recipes`;

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (editingRecipe) {
      setRecipes((prev) => prev.map((r) => (r._id === data._id ? data : r)));
    } else {
      setRecipes((prev) => [data, ...prev]);
    }

    setModalVisible(false);
    setEditingRecipe(null);
  };

  return (
    <div className="main-content">
      <h2>Quản lý công thức của tôi</h2>
      <button onClick={() => openModal()} className="btn-create">➕ Viết công thức mới</button>

      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <div key={recipe._id} className="recipe-card">
            <img src={recipe.image_url || '/default-recipe.jpg'} alt={recipe.title} />
            <h3>{recipe.title}</h3>
            <p>{recipe.description}</p>
            <div className="actions">
              <button onClick={() => setSelectedRecipeId(recipe._id)} className="btn-view">👁 Xem</button>
              <button onClick={() => openModal(recipe)} className="btn">✏️ Sửa</button>
              <button onClick={() => handleDelete(recipe._id)} className="btn-danger">🗑️ Xoá</button>
            </div>
          </div>
        ))}
      </div>

      {modalVisible && (
        <div className="modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingRecipe ? 'Chỉnh sửa công thức' : 'Tạo công thức mới'}</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Tiêu đề"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <textarea
                placeholder="Mô tả"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="URL hình ảnh"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
              <div className="modal-actions">
                <button type="submit" className="btn-success">💾 Lưu</button>
                <button type="button" className="btn-cancel" onClick={() => setModalVisible(false)}>❌ Huỷ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRecipeId && (
        <RecipeModal
          recipeId={selectedRecipeId}
          onClose={() => setSelectedRecipeId(null)}
        />
      )}
    </div>
  );
}
