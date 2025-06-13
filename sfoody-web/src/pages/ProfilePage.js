import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/HomeSidebar';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';
import RecipeModal from '../components/RecipeModal';
import './HomePage.css'; // Dùng chung layout

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const BASE_URL = process.env.REACT_APP_API;
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return navigate('/login');
    fetchUserProfile();
    fetchFavorites();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUser(data);
    } catch (err) {
      console.error('Lỗi khi tải hồ sơ:', err);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await fetch(`${BASE_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setFavorites(data);
    } catch (err) {
      console.error('Lỗi khi tải công thức yêu thích:', err);
    }
  };

  const removeFavorite = async (favoriteId) => {
    try {
      const res = await fetch(`${BASE_URL}/favorites/${favoriteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setFavorites(prev => prev.filter(f => f._id !== favoriteId));
      fetchFavorites();
    } catch (err) {
      console.error('Lỗi khi xóa yêu thích:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };
    const openRecipeModal = (recipe) => {
        setSelectedRecipe(recipe);
    };

  return (
    <div className="home-container">
          <header className="header">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <Link to="/"> 
              <h1 className="header-title">S-Foody</h1>
            </Link>
            <div className="auth-actions">
              {token ? (
                <>
                  <UserMenu onLogout={handleLogout} />
                  <NotificationBell token={token} />
                </>
              ) : (
                <>
                  <Link to="/login" className="login-button">Đăng nhập</Link>
                  <Link to="/register" className="login-button">Đăng ký</Link>
                </>
              )}
            </div>
          </header>

      <div className="home-content">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} token={token} role={role} />
        <main className="main-content">
          <h2>👤 Hồ sơ cá nhân</h2>
          {user ? (
            <div className="profile-card">
              <img className="avatar" src={user.avatar_url || '/default-avatar.png'} alt="avatar" />
              <h3>Tên: {user.username}</h3>
              <p>Email: {user.email}</p>
              <p>Thông tin: {user.bio}</p>
              <Link to="/edit-profile" className="manage-btn">Chỉnh sửa hồ sơ</Link>
              <Link to="/settings" className="manage-btn">Cài đặt</Link>
            </div>
          ) : <p>Đang tải hồ sơ...</p>}

          <h2>❤️ Công thức yêu thích</h2>
          {favorites.length > 0 ? (
            <div className="favorites-grid">
              {favorites.map((fav, index) => (
                <div key={`fav-${fav._id}-${index}`} className="recipe-card">
                  <img
                    className="recipe-image"
                    src={fav.recipe?.image_url || '/default-recipe.jpg'}
                    alt={fav.recipe?.title}
                    onClick={() => openRecipeModal(fav.recipe)}
                  />
                  <div className="recipe-info">
                    <h3>{fav.recipe?.title}</h3>
                    <p>⏱ {fav.recipe?.cook_time} phút</p>
                  </div>
                  <button onClick={() => removeFavorite(fav.id)} className="remove-btn">Bỏ yêu thích</button>
                </div>
              ))}
            </div>
          ) : (
            <p>🫥 Không có công thức yêu thích nào.</p>
          )}
          </main>
        </div>
      
        {selectedRecipe && (
            <RecipeModal
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
            token={token}
            role={role}
            />
        )}
    </div>
  );
}
