import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css'; // dùng layout & card chung

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [groupedTags, setGroupedTags] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/tags/grouped')
      .then(res => res.json())
      .then(setGroupedTags)
      .catch(console.error);
  }, []);

  const handleTagClick = (tagName) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleSearch = async () => {
    const queryString = new URLSearchParams({
      q: query,
      filters: selectedTags.join(','),
    }).toString();

    const res = await fetch(`/api/search?${queryString}`, {
      method: 'POST',
    });
    const data = await res.json();
    setResults(data);
  };

  return (
    <div className="home-layout">
      <header className="sticky-header">
        <div className="app-title">S-Foody</div>
        <div className="auth-actions">
          <a href="/" className="auth-link">Trang chủ</a>
          <a href="/login" className="auth-link">Đăng nhập</a>
        </div>
      </header>

      <main className="feed-main">
        {/* Cột chính */}
        <div className="feed-column">
          <h2 className="feed-title">Tìm kiếm công thức</h2>

          {/* Thanh tìm kiếm */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập từ khóa..."
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #ccc',
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
              }}
            >
              Tìm kiếm
            </button>
          </div>

          {/* Bộ lọc Tag */}
          {Object.entries(groupedTags).map(([category, tags]) => (
            <div key={category} style={{ marginBottom: '1rem' }}>
              <strong>{category}</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {tags.map(tag => (
                  <button
                    key={tag._id}
                    onClick={() => handleTagClick(tag.name)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: selectedTags.includes(tag.name)
                        ? 'none'
                        : '1px solid #ccc',
                      backgroundColor: selectedTags.includes(tag.name)
                        ? '#2563eb'
                        : 'white',
                      color: selectedTags.includes(tag.name)
                        ? 'white'
                        : '#333',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Kết quả */}
          {results.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>
              Không có công thức nào phù hợp.
            </p>
          ) : (
            results.map((recipe) => (
              <div
                key={recipe.id}
                className="recipe-card"
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              >
                <img
                  src={recipe.image_url || '/default-recipe.jpg'}
                  alt={recipe.title}
                  className="recipe-img"
                />
                <div className="recipe-info">
                  <h3>{recipe.title}</h3>
                  <p style={{ color: '#555', fontSize: '14px' }}>
                    {recipe.description || 'Không có mô tả.'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar phải (nếu cần dùng như HomeSidebar) */}
        <div className="right-column">
          <div className="sidebar-title">Gợi ý phổ biến</div>
          <p>• Gà chiên mắm</p>
          <p>• Bánh mì pate</p>
          <p>• Salad healthy</p>
        </div>
      </main>
    </div>
  );
}
