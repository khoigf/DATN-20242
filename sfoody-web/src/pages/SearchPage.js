import React, { useEffect, useState } from 'react';
import RecipeModal from '../components/RecipeModal';
import { User, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/HomeSidebar';

const BASE_URL = process.env.REACT_APP_API;

export default function SearchPage() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tags, setTags] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [popularTags, setPopularTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  useEffect(() => {
    fetch(`${BASE_URL}/tags/grouped`)
      .then((res) => res.json())
      .then((data) => setTags(data));

    fetch(`${BASE_URL}/tags`)
      .then((res) => res.json())
      .then((data) => {
        const top = data.slice(0, 10); // giả định lấy 10 tag phổ biến
        setPopularTags(top);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  const fetchRecipes = (query, tagList) => {
    setLoading(true);
    setNoResults(false);
    const filters = tagList.length > 0 ? `filters=${tagList.join(',')}` : '';
    fetch(`${BASE_URL}/search?q=${query}&${filters}`)
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.length === 0) {
          setNoResults(true);
        } else {
          setRecipes(data);
        }
      });
  };

  const handleTagClick = (tagName) => {
    const newTags = selectedTags.includes(tagName)
      ? selectedTags.filter((tag) => tag !== tagName)
      : [...selectedTags, tagName];
    setSelectedTags(newTags);
    fetchRecipes(searchQuery, newTags);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecipes(searchQuery, selectedTags);
  };

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
          <button type="submit" className="manage-btn" style={{ marginLeft: '0.5rem' }}>Tìm</button>
        </form>
        <div className="auth-actions">
          {token ? (
            <>
              {role === 'user' && (
                <Link to="/recipes/manage" className="manage-btn">
                  <User size={18} />
                </Link>
              )}
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={18} />
              </button>
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
          <h2 className="feed-title">Kết quả tìm kiếm</h2>
          {loading && <p>Đang tìm kiếm...</p>}
          {noResults && !loading && <p>Không có công thức phù hợp.</p>}

          {recipes.map((recipe) => (
            <div className="recipe-card" key={recipe.id} onClick={() => setSelectedRecipe(recipe)}>
              <img src={recipe.image_url || '/default-recipe.jpg'} className="recipe-img" alt="Recipe" />
              <div className="recipe-info">
                <h3>{recipe.title}</h3>
                <p>{recipe.description}</p>
              </div>
            </div>
          ))}

          {selectedRecipe && (
            <RecipeModal
              recipe={selectedRecipe}
              onClose={() => setSelectedRecipe(null)}
            />
          )}
        </div>

        <div className="right-column">
          <div>
            <h3 className="sidebar-title">Bộ lọc theo tag</h3>
            {Object.entries(tags).map(([category, tagList]) => (
              <div key={category}>
                <h4>{category}</h4>
                <div className="tag-list">
                  {tagList.map(tag => (
                    <button
                      key={tag._id}
                      className={`tag-button ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                      onClick={() => handleTagClick(tag.name)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="tag-suggestions" style={{ marginTop: '1rem' }}>
            <h4 className="sidebar-title">🔍 Gợi ý phổ biến:</h4>
            <div className="tag-list">
              {popularTags.map(tag => (
                <button
                  key={tag._id}
                  className="tag-button"
                  onClick={() => handleTagClick(tag.name)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
