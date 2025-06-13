import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';
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
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const observer = useRef();

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const BASE_URL = process.env.REACT_APP_API;
  const navigate = useNavigate();

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

  const handleDelete = (id) => {
    setConfirmDialog({
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa công thức này?',
      onConfirm: async () => {
        try {
          await fetch(`${BASE_URL}/recipes/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          setRecipes(recipes.filter(r => r._id !== id));
        } catch (err) {
          console.error(err);
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
    <div className="home-container">
      <header className="header">
        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        <Link to="/"> 
          <h1 className="header-title">S-Foody</h1>
        </Link>
        <div className="search-bar">
            <input
              type="text"
              placeholder="Tìm công thức của bạn..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
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
          <h2 className="section-title">📋 Công thức của tôi</h2>

          <div className="recipe-grid">
            {recipes.map((recipe, index) => {
              const isLast = index === recipes.length - 1;
              return (
                <div
                  className="recipe-card"
                  key={recipe._id}
                  ref={isLast ? lastRecipeRef : null}
                >
                  <img
                    className="recipe-image"
                    src={recipe.image_url || '/default-recipe.jpg'}
                    alt={recipe.title}
                    onClick={() => setSelectedRecipe(recipe)}
                  />
                  <div className="recipe-info">
                    <div className="recipe-name">{recipe.title}</div>
                    <div className="recipe-meta">{recipe.description}</div>
                    <div className="card-actions">
                      <button className="action-btn view" title="Xem công thức" onClick={() => setSelectedRecipe(recipe)}>
                        <FaEye />
                      </button>
                      <button className="action-btn edit" title="Chỉnh sửa" onClick={() => setShowCreateModal(recipe)}>
                        <FaEdit />
                      </button>
                      <button className="action-btn delete" title="Xóa" onClick={() => handleDelete(recipe._id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {loading && <div className="loader">Đang tải thêm...</div>}
          {!hasMore && !loading && <div className="loader">✅ Đã tải hết công thức.</div>}

          <button
            className="floating-add-button"
            onClick={() => setShowCreateModal(true)}
            title="Tạo công thức mới"
          >＋</button>
        </main>
      </div>

      {selectedRecipe && (
        <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}
      {showCreateModal && (
        typeof showCreateModal === 'object' ? (
          <EditRecipeModal recipe={showCreateModal} onClose={() => {
            setShowCreateModal(false);
            loadRecipes(1, search);
          }} />
        ) : (
          <CreateRecipeModal onClose={() => {
            setShowCreateModal(false);
            loadRecipes(1, search);
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
