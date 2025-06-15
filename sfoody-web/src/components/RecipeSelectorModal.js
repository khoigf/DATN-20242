import React, { useEffect, useState } from 'react';

const BASE_URL = process.env.REACT_APP_API;

const RecipeSelectorModal = ({ onSelect, onClose }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`${BASE_URL}/recipes?limit=50`);
        const data = await res.json();
        if (res.ok) setRecipes(data);
      } catch (err) {
        console.error('Lỗi khi tải danh sách món:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Chọn món ăn</h2>
        <button onClick={onClose} className="close-button">Đóng</button>

        {loading ? (
          <p>⏳ Đang tải...</p>
        ) : (
          <div className="recipe-list">
            {recipes.map(recipe => (
              <div
                key={recipe._id}
                className="recipe-item"
                onClick={() => onSelect(recipe)}
              >
                <img src={recipe.image_url || '/placeholder.png'} alt={recipe.title} />
                <div>
                  <strong>{recipe.title}</strong>
                  <p>⏱ {recipe.cook_time || 30} phút</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeSelectorModal;
