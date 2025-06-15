import React, { useEffect, useState } from 'react';
import RecipeModal from './RecipeModal';
import '../pages/HomePage.css';

const BASE_URL = process.env.REACT_APP_API;

const MealPlanCard = ({ plan, onDelete, onEdit }) => {
  const [mealsByDay, setMealsByDay] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  useEffect(() => {
    const fetchRecipes = async () => {
      let grouped = [];

        for (let i = 0; i < plan.meals.length; i += 3) {
          const dayOffset = i / 3;
          const date = new Date(plan.date);
          date.setDate(date.getDate() + dayOffset);

          const meals = plan.meals.slice(i, i + 3).map(m => ({ ...m, date }));
          grouped.push(meals);
      }

      const final = [];

      for (let meals of grouped) {
        const recipes = {};

        for (let meal of meals) {
          if (!meal.recipe_id) continue;
          try {
            const res = await fetch(`${BASE_URL}/recipes/${meal.recipe_id}`);
            const data = await res.json();
            if (res.ok) recipes[meal.meal_time] = data;
          } catch (err) {
            console.error('Lỗi tải món:', err);
          }
        }

        final.push({ date: meals[0].date, recipes });
      }

      setMealsByDay(final);
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
        {/* Nếu chưa có dữ liệu thì hiển thị loading */}
        {mealsByDay.length === 0 ? (
          <p className="Mloading">Đang tải thực đơn...</p>
        ) : (
          <>
            {/* Tabs chọn ngày */}
            <div className="Mday-tabs">
              {mealsByDay.map((day, idx) => (
                <button
                  key={idx}
                  className={`Mday-tab ${idx === currentDayIndex ? 'active' : ''}`}
                  onClick={() => setCurrentDayIndex(idx)}
                >
                  {new Date(day.date).toLocaleDateString('vi-VN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'numeric'
                  })}
                </button>
              ))}
            </div>

            {/* Thực đơn ngày hiện tại */}
            {mealsByDay[currentDayIndex] && (
              <div className="Mmeal-day-block">
                <h3 className="Mplan-date">
                  📅 {formatDate(mealsByDay[currentDayIndex].date)}
                </h3>
                <div className="Mmeal-list">
                  {['breakfast', 'lunch', 'dinner'].map((meal) => (
                    <div key={meal} className="Mmeal-item">
                      <h4 className="Mmeal-title">
                        {meal === 'breakfast'
                          ? '🍳 Bữa sáng'
                          : meal === 'lunch'
                          ? '🍛 Bữa trưa'
                          : '🍲 Bữa tối'}
                      </h4>
                      {mealsByDay[currentDayIndex].recipes[meal] ? (
                        <div
                          className="Mrecipe-preview"
                          onClick={() =>
                            setSelectedRecipe(
                              mealsByDay[currentDayIndex].recipes[meal]
                            )
                          }
                          style={{ cursor: 'pointer' }}
                        >
                          <img
                            src={
                              mealsByDay[currentDayIndex].recipes[meal]
                                .image_url || '/placeholder.png'
                            }
                            alt=""
                          />
                          <div>
                            <strong className="Mname">
                              {mealsByDay[currentDayIndex].recipes[meal].title}
                            </strong>
                            <p>
                              ⏱{' '}
                              {
                                mealsByDay[currentDayIndex].recipes[meal]
                                  .cook_time
                              }{' '}
                              phút
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="Mno-recipe">(Không có món phù hợp)</p>
                      )}
                    </div>
                  ))}
                </div>
                {onDelete && (
                  <div className="Mplan-actions">
                    <button className="Mbtn edit" onClick={() => onEdit(plan)}>✏️ Sửa</button>
                    <button className="Mbtn delete" onClick={() => onDelete(plan._id)}>🗑 Xoá</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
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