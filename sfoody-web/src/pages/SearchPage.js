import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './HomePage.css';
import RecipeModal from '../components/RecipeModal';

export default function SearchPage() {
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const BASE_URL = process.env.REACT_APP_API;

  useEffect(() => {
    fetch(`${BASE_URL}/tags`)
      .then(res => res.json())
      .then(data => setTags(data));
  }, [BASE_URL]);

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSearch = () => {
    fetch(`${BASE_URL}/recipes?tags=${selectedTags.join(',')}`)
      .then(res => res.json())
      .then(data => setRecipes(data));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <div className="home-container">
      <aside className="sidebar">
        <Link to="/" className="logo"><img src="/logo.png" alt="S-Foody" width={50} height={50} /></Link>
        <div className="sidebar-icons">
          <Link to="/"><button>🏠</button></Link>
          <Link to="/recipes/manage"><button>📃</button></Link>
          <Link to="/search"><button>🔍</button></Link>
          <Link to="#"><button>⚙️</button></Link>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div>
            <h1 className="title">Tìm kiếm món ăn</h1>
            <p className="subtitle">Lọc theo sở thích, nguyên liệu, chế độ ăn...</p>
          </div>
          <div className="auth-buttons">
            {token ? (
              <>
                <button onClick={handleLogout} className="logout">Đăng xuất</button>
                {role === 'user' && (
                  <Link to="/recipes/manage" className="manage-btn">Quản lý bài viết</Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="login">Đăng nhập</Link>
                <Link to="/register" className="register">Đăng ký</Link>
              </>
            )}
          </div>
        </header>

        <section className="search-section">
          <div className="tag-filters">
            {tags.map(tag => (
              <button
                key={tag._id}
                className={`tag-btn ${selectedTags.includes(tag._id) ? 'selected' : ''}`}
                onClick={() => handleTagToggle(tag._id)}
              >
                {tag.name}
              </button>
            ))}
          </div>
          <button onClick={handleSearch} className="search-btn">🔍 Tìm kiếm</button>
        </section>

        <section className="feed-section">
          <h2 className="feed-title">Kết quả tìm kiếm</h2>
          <div className="recipe-grid">
            {recipes.map(recipe => (
              <div key={recipe._id} className="recipe-card" onClick={() => setSelectedRecipe(recipe)}>
                <img src={recipe.image_url || '/default-recipe.jpg'} alt={recipe.title} className="recipe-image" />
                <div className="recipe-content">
                  <h2 className="recipe-title">{recipe.title}</h2>
                  <p className="recipe-desc">{recipe.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        {selectedRecipe &&(
            <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
        )}    
      </main>
    </div>
  );
}
