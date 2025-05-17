import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/HomeSidebar';
import RecipeModal from '../components/RecipeModal';
import CreateRecipeModal from '../components/CreatePostCard';
import UserMenu from '../components/UserMenu';
import { Link } from 'react-router-dom';
import EditRecipeModal from '../components/EditRecipeModal';
import ConfirmDialog from '../components/ConfirmDialog';
import NotificationBell from '../components/NotificationBell';
import './HomePage.css';

export default function ManageRecipePage() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const BASE_URL = process.env.REACT_APP_API;
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) navigate('/login');
    fetch(`${BASE_URL}/recipes/user`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRecipes(data))
      .catch((err) => console.error(err));
  }, [BASE_URL, token, navigate]);

  const handleDelete = async (id) => {
  setConfirmDialog({
    title: 'Xác nhận xóa',
    message: 'Bạn có chắc chắn muốn xóa công thức này?',
    onConfirm: async () => {
      try {
        await fetch(`${BASE_URL}/recipes/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecipes(recipes.filter((r) => r._id !== id));
      } catch (error) {
        console.error(error);
      }
      setConfirmDialog(null);
    },
    onCancel: () => setConfirmDialog(null),
  });
};
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  }

  return (
    <div className="home-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} token={token} role={role} />

      <header className="sticky-header">
        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        <div className="brand-area">
          <Link to="/" className="logo">
            <img src="/logo.png" alt="S-Foody" width={50} height={50} />
          </Link>
          <div className="text-group">
            <h1 className="title">Quản lý công thức</h1>
            <p className="subtitle">Bài viết của bạn</p>
          </div>
        </div>
        <div className="auth-actions">
                  {token ? (
                    <>
                      {role === 'user' && <UserMenu onLogout={handleLogout} />}
                      <NotificationBell token={token} />
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="manage-btn">Đăng nhập</Link>
                      <Link to="/register" className="manage-btn">Đăng ký</Link>
                    </>
                  )}
                </div>
      </header>

      <main className="feed-main">
        <div className="feed-column">
          <button className="create-btn" onClick={() => setShowCreateModal(true)}>
            Tạo công thức mới ✍️
          </button>
          <h2 className="feed-title">📋 Công thức của tôi</h2>
          {recipes.length === 0 && <p>Chưa có công thức nào.</p>}
          {recipes.map((recipe) => (
            <div className="recipe-card" key={recipe._id}>
              <img
                className="recipe-img"
                src={recipe.image_url || '/default-recipe.jpg'}
                alt={recipe.title}
                onClick={() => setSelectedRecipe(recipe)}
              />
              <div className="recipe-info">
                <h3>{recipe.title}</h3>
                <p>{recipe.description}</p>
                <div className="card-actions">
                  <button className="view-btn" onClick={() => setSelectedRecipe(recipe)} title="Xem chi tiết">
                    👁️
                  </button>
                  <button className="edit-btn" onClick={() => setShowCreateModal(recipe)} title="Chỉnh sửa">
                    ✏️
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(recipe._id)} title="Xóa bài viết">
                    🗑️
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
        <aside className="right-column">
          <h3 className="sidebar-title">Gợi ý hôm nay</h3>
          <p>🍲 Khám phá món ăn mới mỗi ngày!</p>
          {/* Future: top recipes, authors */}
        </aside>
      </main>

      {selectedRecipe && (
        <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}

      {showCreateModal && (
        typeof showCreateModal === 'object' ? (
          <EditRecipeModal recipe={showCreateModal} onClose={(refresh) => {
            if (refresh) window.location.reload(); // hoặc refetch dữ liệu
            setShowCreateModal(false);
          }} />
        ) : (
          <CreateRecipeModal onClose={() => setShowCreateModal(false)} />
        )
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
      
    </div>
  );
}
