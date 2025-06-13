// File: SearchPage.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import RecipeModal from '../components/RecipeModal';
import UserMenu from '../components/UserMenu';
import Sidebar from '../components/HomeSidebar';
import NotificationBell from '../components/NotificationBell';
import './HomePage.css';

const BASE_URL = process.env.REACT_APP_API;

export default function SearchPage() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [tags, setTags] = useState({});
  const [popularTags, setPopularTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const navigate = useNavigate();
  const observer = useRef();

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const [groupedRes, allTagsRes] = await Promise.all([
          fetch(`${BASE_URL}/tags/grouped`),
          fetch(`${BASE_URL}/tags`)
        ]);
        const groupedData = await groupedRes.json();
        const allTagsData = await allTagsRes.json();
        setTags(groupedData);
        setPopularTags(allTagsData.slice(0, 10));
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    };
    fetchTags();
  }, []);

  const fetchRecipes = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const filters = [...selectedTags, ...selectedIngredients];
    const url = new URL(`${BASE_URL}/search`);
    url.searchParams.append('q', searchQuery);
    filters.forEach((f) => url.searchParams.append('tags', f));
    url.searchParams.append('offset', page * 20);

    try {
      const res = await fetch(url.toString());
      const data = await res.json();
      setRecipes((prev) => [...prev, ...data]);
      setHasMore(data.length === 20);
      setPage((prev) => prev + 1);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTags, selectedIngredients, page, loading, hasMore]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(0);
      setRecipes([]);
      setHasMore(true);
      setHasSearched(true);
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedTags, selectedIngredients]);

  useEffect(() => {
    if (page === 0 && hasMore) fetchRecipes();
  }, [page, fetchRecipes, hasMore]);

  const lastRecipeRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) fetchRecipes();
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, fetchRecipes]);

  const toggleTag = (tagName) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const toggleIngredient = (name) => {
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nhập công thức nấu ăn..."
          />
        </div>
        {token ? (
          <div className="auth-actions">
            <UserMenu onLogout={handleLogout} />
            <NotificationBell token={token} />
          </div>
        ) : (
          <button className="login-button" onClick={() => navigate('/login')}>Đăng nhập</button>
        )}
      </header>

      <main className="feed-main">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} token={token} role={role} />

        <div className="left-column">
          <button className="filter-toggle-btn" onClick={() => setShowTagFilter((prev) => !prev)}>
            {showTagFilter ? '⬇ Hiện bộ lọc' : '⬆ Ẩn bộ lọc'}
          </button>

          {showTagFilter && (
            <div className="tag-filter-container">
              <section className="filter-section">
                <h3 className="section-title">🎯 Bộ lọc theo tag</h3>
                <div className="tag-columns">
                  {Object.entries(tags).map(([category, tagList]) => (
                    <div key={category} className="tag-group">
                      <h4 className="tag-group-title">{category}</h4>
                      <div className="tag-list">
                        {tagList.map((tag) => (
                          <button
                            key={tag._id}
                            className={`tag-button ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                            onClick={() => toggleTag(tag.name)}
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="filter-section">
                <h4 className="section-title">🌿 Tìm kiếm phổ biến</h4>
                <div className="tag-group">
                  <div className="tag-list">
                    {popularTags.map((tag) => (
                      <button
                        key={tag._id}
                        className={`tag-button ${selectedIngredients.includes(tag.name) ? 'selected' : ''}`}
                        onClick={() => toggleIngredient(tag.name)}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        <div className="feed-column">
          <h2 className="feed-title">📋 Kết quả tìm kiếm</h2>
          <div className="recipe-grid">
            {recipes.map((recipe, index) => {
              const isLast = index === recipes.length - 1;
              return (
                <div
                  ref={isLast ? lastRecipeRef : null}
                  className="recipe-card"
                  key={`recipe-${recipe.id}-${index}`}
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <img
                    src={recipe.image_url || '/default-recipe.jpg'}
                    className="recipe-image"
                    alt={recipe.title}
                  />
                  <div className="recipe-info">
                    <h3 className="recipe-name">{recipe.title}</h3>
                    <p className="recipe-description">{recipe.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {loading && <p className="loading-text">🔄 Đang tải thêm...</p>}
          {!hasMore && !loading && hasSearched && <p className="end-text">✅ Đã tải toàn bộ kết quả.</p>}

          {selectedRecipe && (
            <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
          )}
        </div>
      </main>
    </div>
  );
}
