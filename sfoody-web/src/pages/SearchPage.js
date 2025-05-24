import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RecipeModal from '../components/RecipeModal';
import UserMenu from '../components/UserMenu';
import Sidebar from '../components/HomeSidebar';
import NotificationBell from '../components/NotificationBell';

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

  // Load tag & ingredient data
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

  // Fetch recipes with scroll-based pagination
  const fetchRecipes = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const filters = [...selectedTags, ...selectedIngredients];

    const url = new URL(`${BASE_URL}/search`);
    url.searchParams.append('q', searchQuery);
    filters.forEach((f) => url.searchParams.append('tags', f)); // cả tag & ingredient đều là tag ở backend
    url.searchParams.append('offset', page * 20); // page size = 20

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

  // Reset when search or filters change
  useEffect(() => {
    if (hasSearched) {
      setRecipes([]);
      setPage(0);
      setHasMore(true);
    }
  }, [searchQuery, selectedTags, selectedIngredients, hasSearched]);

  useEffect(() => {
    if (page === 0 && hasMore) fetchRecipes();
  }, [page, fetchRecipes, hasMore]);

  // Infinite scroll
  const lastRecipeRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) fetchRecipes();
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, fetchRecipes]
  );

  // Handlers
  const toggleTag = (tagName) => {
    const updated = selectedTags.includes(tagName)
      ? selectedTags.filter((t) => t !== tagName)
      : [...selectedTags, tagName];
    setSelectedTags(updated);
  };

  const toggleIngredient = (name) => {
    const updated = selectedIngredients.includes(name)
      ? selectedIngredients.filter((i) => i !== name)
      : [...selectedIngredients, name];
    setSelectedIngredients(updated);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setRecipes([]);
    setHasMore(true);
    setHasSearched(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  // UI
  return (
    <div className="home-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} token={token} role={role} />

      <header className="sticky-header">
        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>

        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm công thức nấu ăn..."
            style={{ padding: '0.5rem', borderRadius: '10px' }}
          />
          <button type="submit" className="manage-btn" style={{ marginLeft: '0.5rem' }}>
            Tìm
          </button>
        </form>

        <div className="auth-actions">
          {token ? (
            <>
              <UserMenu onLogout={handleLogout} />
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
        <div className="left-column">
          <button
            className="tag-toggle-btn"
            onClick={() => setShowTagFilter((prev) => !prev)}
          >
            {showTagFilter ? 'Hiện bộ lọc 🔽' : 'Ẩn bộ lọc 🔼'}
          </button>

          {!showTagFilter && (
            <>
              <div>
                <h3 className="sidebar-title">🎯 Bộ lọc theo tag</h3>
                {Object.entries(tags).map(([category, tagList]) => (
                  <div key={category}>
                    <h4>{category}</h4>
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

              <div style={{ marginTop: '1rem' }}>
                <h4 className="sidebar-title">🌿 Tìm kiếm phổ biến</h4>
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
            </>
          )}
        </div>
        <div className="feed-column">
          <h2 className="feed-title">Kết quả tìm kiếm</h2>
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
                  className="recipe-img"
                  alt={recipe.title}
                />
                <div className="recipe-info">
                  <h3>{recipe.title}</h3>
                  <p>{recipe.description}</p>
                </div>
              </div>
            );
          })}
          {loading && <p>🔄 Đang tải thêm...</p>}
          {!hasMore && !loading && <p>✅ Đã tải toàn bộ kết quả.</p>}

          {selectedRecipe && (
            <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
          )}
        </div>

      </main>
    </div>
  );
}
