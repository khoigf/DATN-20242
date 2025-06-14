import React, { useState, useEffect, useCallback } from 'react';
import './HomePage.css';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/HomeSidebar';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';
import RecipeModal from '../components/RecipeModal';
import CreateRecipeModal from '../components/CreatePostCard';

const BASE_URL = process.env.REACT_APP_API;

const HomePage = () => {
  const [recipes, setRecipes] = useState([]);
  const [suggestedRecipes, setSuggestedRecipes] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const loadRecipes = useCallback(async (pageToLoad = 1, searchQuery = search) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/recipes?search=${encodeURIComponent(searchQuery)}&page=${pageToLoad}&limit=8`);
      const data = await res.json();
      if (res.ok) {
        const newRecipes = data.recipes || [];
        setRecipes(prev => (pageToLoad === 1 ? newRecipes : [...prev, ...newRecipes]));
        const total = data.total || 0;
        const loadedSoFar = (pageToLoad - 1) * 8 + newRecipes.length;
        setHasMore(loadedSoFar < total);
      }
    } catch (err) {
      console.error('Lỗi khi tải công thức:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadSuggestedRecipes = useCallback(async () => {
  try {
    const res = await fetch(`${BASE_URL}/recipes/suggest`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (res.ok && data.plan) {
      const { meals, date } = data.plan;

      // Nhóm theo từng ngày (7 ngày x 3 bữa)
      const grouped = [];
      for (let i = 0; i < 7; i++) {
        const dateObj = new Date(date);
        dateObj.setDate(dateObj.getDate() + i);

        const dayMeals = meals.slice(i * 3, i * 3 + 3);

        // Fetch chi tiết từng recipe
        const detailedMeals = await Promise.all(
          dayMeals.map(async (meal) => {
            const res = await fetch(`${BASE_URL}/recipes/${meal.recipe_id}`);
            const recipe = await res.json();
            return {
              ...recipe,
              meal_time: meal.meal_time
            };
          })
        );

        grouped.push({
          date: dateObj.toISOString(),
          meals: detailedMeals
        });
      }

      setSuggestedRecipes(grouped);
    } else {
      console.error('Lỗi khi tải thực đơn:', data.message || 'Unknown error');
    }
  } catch (err) {
    console.error('Lỗi khi tải thực đơn:', err);
  } finally {
    setLoading(false);
  }
}, [token]);

  useEffect(() => {
    loadRecipes(1);
    loadSuggestedRecipes();
  }, [loadRecipes, loadSuggestedRecipes]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRecipes(1, search);
  };

  const handleRecipeClick = (recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <div className="home-container">
      <header className="header">
        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰ </button>
        <Link to="/"> 
          <h1 className="header-title">S-Foody</h1>
        </Link>
        <form className="search-bar" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Hôm nay ăn gì?"
          />
        </form>
        { token && (
          <div className="auth-actions">
            <UserMenu onLogout={handleLogout} />
            <NotificationBell token={token} />
          </div>)}
        {!token && (
          <button className="login-button" onClick={() => navigate('/login')}>Đăng nhập</button>
        )}
      </header>

      <div className="home-content">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} token={token} role={role} />

        <main className="main-content">
          <h2 className="section-title">Công thức phổ biến</h2>
          <div className="recipe-grid">
            {recipes.map((recipe, index) => (
              <div key={index} className="recipe-card" onClick={() => handleRecipeClick(recipe)}>
                <img src={recipe.image_url || '/placeholder.png'} className="recipe-image" alt={recipe.title} />
                <div className="recipe-info">
                  <div className="recipe-name">{recipe.title}</div>
                  <div className="recipe-meta">⏱ {recipe.cook_time || 30} phút</div>
                </div>
              </div>
            ))}
          </div>

          {loading && <div className="loader">Đang tải thêm...</div>}
          {hasMore && !loading && (
            <div className="load-more">
              <button onClick={() => {
                const nextPage = page + 1;
                setPage(nextPage);
                loadRecipes(nextPage);
              }}>Tải thêm</button>
            </div>
          )}
          <h2 className="section-title">Gợi ý thực đơn tuần</h2>
          <div>
            <div className="suggested-plan">
              {suggestedRecipes.map((dayPlan, index) => (
                <div key={index} className="daily-plan">
                  <h3 className="date-heading">
                    {new Date(dayPlan.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                  </h3>
                  <div className="recipe-grid">
                    {dayPlan.meals.map((recipe, idx) => (
                      <div key={idx} className="recipe-card" onClick={() => handleRecipeClick(recipe)}>
                        <img src={recipe.image_url || '/placeholder.png'} className="recipe-image" alt={recipe.title} />
                        <div className="recipe-info">
                          <div className="recipe-name">{recipe.title}</div>
                          <div className="recipe-meta">
                            🍽 {recipe.meal_time} &nbsp;|&nbsp; ⏱ {recipe.cook_time || 30} phút
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {selectedRecipe && (
          <RecipeModal
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
          />
        )}

        {showCreateModal && (
          <CreateRecipeModal onClose={() => setShowCreateModal(false)} />
        )}

        <button
          className="floating-add-button"
          onClick={() => setShowCreateModal(true)}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default HomePage;
