import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/HomeSidebar';
import RecipeModal from '../components/RecipeModal';
import CreateRecipeModal from '../components/CreatePostCard';
import EditRecipeModal from '../components/EditRecipeModal';
import ConfirmDialog from '../components/ConfirmDialog';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';
import './HomePage.css';

export default function ManageRecipePage() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
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

  // Redirect if not logged in
  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  const loadRecipes = useCallback(async (pageToLoad = 1, searchQuery = search) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/recipes/user?search=${encodeURIComponent(searchQuery)}&page=${pageToLoad}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const newRecipes = data.recipes || data || [];
        setRecipes(prev => pageToLoad === 1 ? newRecipes : [...prev, ...newRecipes]);
        const total = data.total || newRecipes.length;
        const loadedSoFar = (pageToLoad - 1) * 10 + newRecipes.length;
        setHasMore(loadedSoFar < total);
      } else if (data.msg === 'Token không hợp lệ') {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
      }
    } catch (err) {
      console.error('Lỗi khi tải công thức:', err);
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, token, navigate, search]);

  useEffect(() => {
    setPage(1);
    setRecipes([]);
    setHasMore(true);
    loadRecipes(1, search);
  }, [search, loadRecipes]);

  useEffect(() => {
    if (page > 1) loadRecipes(page, search);
  }, [page, search, loadRecipes]);

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
          <button className="create-btn" onClick={() => setShowCreateModal(true)}>Tạo công thức mới ✍️</button>
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Tìm công thức của bạn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <h2 className="feed-title">📋 Công thức của tôi</h2>
          {recipes.map((recipe, index) => {
            const isLast = index === recipes.length - 1;
            return (
              <div
                ref={isLast ? lastRecipeRef : null}
                className="recipe-card"
                key={recipe._id}
              >
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
                    <button className="view-btn" onClick={() => setSelectedRecipe(recipe)}>👁️</button>
                    <button className="edit-btn" onClick={() => setShowCreateModal(recipe)}>✏️</button>
                    <button className="delete-btn" onClick={() => handleDelete(recipe._id)}>🗑️</button>
                  </div>
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
        typeof showCreateModal === 'object' ? (
          <EditRecipeModal recipe={showCreateModal} onClose={() => {
            setShowCreateModal(false);
            loadRecipes(1, search); // Refresh list
          }} />
        ) : (
          <CreateRecipeModal onClose={() => {
            setShowCreateModal(false);
            loadRecipes(1, search); // Refresh list
          }} />
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
