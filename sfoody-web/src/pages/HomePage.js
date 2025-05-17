import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './HomePage.css';
import UserMenu from '../components/UserMenu';
import Sidebar from '../components/HomeSidebar';
import RecipeModal from '../components/RecipeModal';
import CreateRecipeModal from '../components/CreatePostCard';
import NotificationBell from '../components/NotificationBell';

export default function HomePage() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const BASE_URL = process.env.REACT_APP_API;

  useEffect(() => {
    fetch(`${BASE_URL}/recipes`)
      .then(res => res.json())
      .then(data => setRecipes(data));
  }, [BASE_URL]);

  const navigate = useNavigate();
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
              <h1 className="title">S-Foody</h1>
              <p className="subtitle">Hôm nay ăn gì?</p>
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
          {token && (
            <button className="create-btn" onClick={() => setShowCreateModal(true)}>
              Tạo công thức mới ✍️
            </button>
          )}
          <h2 className="feed-title">🆕 Công thức mới</h2>
          {recipes.map(recipe => (
            <div className="recipe-card" key={recipe._id} onClick={() => setSelectedRecipe(recipe)}>
              <img className="recipe-img" src={recipe.image_url || '/default-recipe.jpg'} alt={recipe.title} />
              <div className="recipe-info">
                <h3>{recipe.title}</h3>
                <p>{recipe.description}</p>
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

      {showCreateModal && <CreateRecipeModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
