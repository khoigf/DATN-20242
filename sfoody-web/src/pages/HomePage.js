import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const observer = useRef();

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const BASE_URL = process.env.REACT_APP_API;
  const navigate = useNavigate();

  // Load recipes
  const loadRecipes = useCallback(async (pageToLoad = 1, searchQuery = search) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/recipes?search=${encodeURIComponent(searchQuery)}&page=${pageToLoad}&limit=10`);
      const data = await res.json();
      if (res.ok) {
        const newRecipes = data.recipes || [];
        setRecipes(prev => (pageToLoad === 1 ? newRecipes : [...prev, ...newRecipes]));
        const total = data.total || 0;
        const loadedSoFar = (pageToLoad - 1) * 10 + newRecipes.length;
        setHasMore(loadedSoFar < total);
      }
    } catch (err) {
      console.error('Lỗi khi tải công thức:', err);
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, search]);

  // Khi search thay đổi -> reset page về 1
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setRecipes([]);
    loadRecipes(1, search);
  }, [search, loadRecipes]);

  // Khi page > 1, load thêm công thức (scroll)
  useEffect(() => {
    if (page > 1) loadRecipes(page, search);
  }, [page, search, loadRecipes]);

  // Infinite scroll
  const lastRecipeRef = useCallback(node => {
    if (loading || !hasMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setPage(prev => prev + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

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
      {/* Gợi ý hôm nay - dành cho mobile */}
        <div className="suggestion-fab" onClick={() => setShowSuggestion(true)}>
          💡
        </div>

        {showSuggestion && (
          <div className="suggestion-popup">
            <button className="close-popup" onClick={() => setShowSuggestion(false)}>✖</button>
            <h3>Gợi ý hôm nay</h3>
            <p>🍲 Khám phá món ăn mới mỗi ngày!</p>
          </div>
        )}

        <div className="feed-column">
          {token && (
            <button className="create-btn" onClick={() => setShowCreateModal(true)}>
              Tạo công thức mới ✍️
            </button>
          )}

          <input
            type="text"
            className="search-input"
            placeholder="🔍 Tìm công thức theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <h2 className="feed-title">🆕 Công thức mới</h2>

          {recipes.map((recipe, index) => {
            const isLast = index === recipes.length - 1;
            return (
              <div
                ref={isLast ? lastRecipeRef : null}
                className="recipe-card"
                key={`recipe-${recipe._id}-${index}`}
                onClick={() => setSelectedRecipe(recipe)}
              >
                <img className="recipe-img" src={recipe.image_url || '/default-recipe.jpg'} alt={recipe.title} />
                <div className="recipe-info">
                  <h3>{recipe.title}</h3>
                  <p>{recipe.description}</p>
                </div>
              </div>
            );
          })}

          {loading && <p>Đang tải thêm...</p>}
          {!hasMore && !loading && <p>✅ Đã tải hết công thức.</p>}
        </div>

        <aside className="right-column hide-on-mobile">
          <h3 className="sidebar-title">Gợi ý hôm nay</h3>
          <p>🍲 Khám phá món ăn mới mỗi ngày!</p>
        </aside>
      </main>

      {selectedRecipe && (
        <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}

      {showCreateModal && (
        <CreateRecipeModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
