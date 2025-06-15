import React, { useEffect, useState } from 'react';
import RecipeModal from './RecipeModal';
import '../pages/HomePage.css'; // Nếu bạn dùng HomePage.css cho UI chung

const BASE_URL = process.env.REACT_APP_API;

const RecipeSelectorModal = ({ isOpen, onClose, onSelect }) => {
  const [recipes, setRecipes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchRecipes();
    }
  }, [isOpen]);

  const fetchRecipes = async () => {
    try {
      const res = await fetch(`${BASE_URL}/recipes`);
      const data = await res.json();
      setRecipes(data.recipes);
    } catch (err) {
      console.error('Lỗi tải công thức:', err);
    }
  };

  const filteredRecipes = recipes.filter(r =>
    r.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (recipe) => {
    onSelect(recipe);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content large">
        <h2>🔍 Chọn món ăn</h2>

        <input
          type="text"
          className="search-input"
          placeholder="Tìm kiếm món ăn..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="recipe-list-scroll">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => (
              <div key={recipe._id} className="recipe-option">
                <img
                  src={recipe.image_url || '/placeholder.png'}
                  alt={recipe.title}
                  onClick={() => setSelected(recipe)}
                />
                <div className="info">
                  <strong>{recipe.title}</strong>
                  <p>⏱ {recipe.cook_time || 30} phút</p>
                  <button onClick={() => handleSelect(recipe)}>Chọn</button>
                </div>
              </div>
            ))
          ) : (
            <p>Không tìm thấy công thức phù hợp.</p>
          )}
        </div>

        <button className="close-btn" onClick={onClose}>Đóng</button>

        {selected && (
          <RecipeModal
            recipe={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
};

export default RecipeSelectorModal;