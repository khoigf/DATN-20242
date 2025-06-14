import React, { useEffect, useState } from 'react';
import RecipeModal from './RecipeModal'; // import RecipeModal nếu chưa có
import '../pages/HomePage.css';

const BASE_URL = process.env.REACT_APP_API;

const MealPlanCard = ({ plan }) => {
  const [recipes, setRecipes] = useState({});
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      const newRecipes = {};
      for (let meal of plan.meals) {
        if (!meal.recipe_id) continue;
        try {
          const res = await fetch(`${BASE_URL}/recipes/${meal.recipe_id}`);
          const data = await res.json();
          if (res.ok) newRecipes[meal.meal_time] = data;
        } catch (err) {
          console.error('Lỗi khi tải món:', err);
        }
      }
      setRecipes(newRecipes);
    };
    fetchRecipes();
  }, [plan]);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('vi-VN', {
      weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <>
      <div className="Mmeal-plan-card">
        <h3 className="Mplan-date">📅 {formatDate(plan.date)}</h3>
        <div className="Mmeal-list">
          {['breakfast', 'lunch', 'dinner'].map(meal => (
            <div key={meal} className="Mmeal-item">
              <h4 className="Mmeal-title">
                {meal === 'breakfast' ? '🍳 Bữa sáng' : meal === 'lunch' ? '🍛 Bữa trưa' : '🍲 Bữa tối'}
              </h4>
              {recipes[meal] ? (
                <div
                  className="Mrecipe-preview"
                  onClick={() => setSelectedRecipe(recipes[meal])}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={recipes[meal].image_url || '/placeholder.png'} alt={recipes[meal].title} />
                  <div>
                    <strong className="Mname">{recipes[meal].title}</strong>
                    <p>⏱ {recipes[meal].cook_time || 30} phút</p>
                  </div>
                </div>
              ) : (
                <p className="Mno-recipe">(Không có món phù hợp)</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </>
  );
};

export default MealPlanCard;