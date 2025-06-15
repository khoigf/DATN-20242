import React, { useEffect, useState } from 'react';
import RecipeModal from './RecipeModal';
import RecipeSelectorModal from './RecipeSelectorModal';
import '../pages/HomePage.css';

const BASE_URL = process.env.REACT_APP_API;

const EditMealPlanModal = ({ plan, onClose, onUpdated }) => {
  const [mealsByDay, setMealsByDay] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectorInfo, setSelectorInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const groupMeals = async () => {
      setIsLoadingPlan(true);
      const grouped = [];

      for (let i = 0; i < plan.meals.length; i += 3) {
        const dayOffset = i / 3;
        const date = new Date(plan.date);
        date.setDate(date.getDate() + dayOffset);

        const meals = plan.meals.slice(i, i + 3).map((m) => ({ ...m, date }));
        const recipes = {};

        for (let meal of meals) {
          if (meal.recipe_id) {
            try {
              const res = await fetch(`${BASE_URL}/recipes/${meal.recipe_id}`);
              const data = await res.json();
              if (res.ok) recipes[meal.meal_time] = { ...data, _mealId: meal._id };
            } catch (err) {
              console.error('Lỗi tải món:', err);
            }
          }
        }

        grouped.push({ date: meals[0].date, recipes });
      }

      setMealsByDay(grouped);
      setIsLoadingPlan(false);
    };

    groupMeals();
  }, [plan]);

  const handleChangeMeal = (dayIndex, mealTime, recipe) => {
    const updated = [...mealsByDay];
    updated[dayIndex].recipes[mealTime] = recipe;
    setMealsByDay(updated);
  };

  const handleDeleteDay = (dayIndex) => {
    const updated = [...mealsByDay];
    updated.splice(dayIndex, 1);
    setMealsByDay(updated);
  };

  const handleSave = async () => {
    const newMeals = [];

    for (let i = 0; i < mealsByDay.length; i++) {
      const { date, recipes } = mealsByDay[i];
      ['breakfast', 'lunch', 'dinner'].forEach((meal_time) => {
        const recipe = recipes[meal_time];
        if (recipe) {
          newMeals.push({
            meal_time,
            recipe_id: recipe._id,
            date: new Date(date),
          });
        }
      });
    }

    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/meal-plans/${plan._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ meals: newMeals }),
      });

      if (res.ok) {
        onUpdated();
        onClose();
      } else {
        console.error('Cập nhật thất bại');
      }
    } catch (err) {
      console.error('Lỗi cập nhật:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>×</button>
          <h2>📝 Sửa thực đơn</h2>
          {isLoadingPlan ? (
            <div className="loading-plan">
                <p>⏳ Đang tải thực đơn...</p>
            </div>
            ) : (
          <div className="Mmeal-edit-list">
            {mealsByDay.map((day, i) => (
              <div key={i} className="Mmeal-edit-day">
                <div className="Mmeal-day-header">
                  <h3>📅 {formatDate(day.date)}</h3>
                  <button className="danger-btn" onClick={() => handleDeleteDay(i)}>Xóa ngày</button>
                </div>

                <div className="Mmeal-list">
                  {['breakfast', 'lunch', 'dinner'].map((mealTime) => (
                    <div key={mealTime} className="Mmeal-item">
                      <h4 className="Mmeal-title">
                        {mealTime === 'breakfast' ? '🍳 Bữa sáng' :
                         mealTime === 'lunch' ? '🍛 Bữa trưa' : '🍲 Bữa tối'}
                      </h4>

                      {day.recipes[mealTime] ? (
                        <div
                          className="Mrecipe-preview"
                          onClick={() => setSelectedRecipe(day.recipes[mealTime])}
                          style={{ cursor: 'pointer' }}
                        >
                          <img
                            src={day.recipes[mealTime].image_url || '/placeholder.png'}
                            alt={day.recipes[mealTime].title}
                          />
                          <div>
                            <strong>{day.recipes[mealTime].title}</strong>
                            <p>⏱ {day.recipes[mealTime].cook_time || 30} phút</p>
                          </div>
                        </div>
                      ) : (
                        <p className="Mno-recipe">Chưa chọn món</p>
                      )}

                      <button
                        className="secondary-btn"
                        onClick={() => setSelectorInfo({ dayIndex: i, mealTime })}
                      >
                        Chọn món
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
          <div className="modal-footer">
            <button className="secondary-btn" onClick={onClose}>Đóng</button>
            <button className="primary-btn" onClick={handleSave} disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {selectorInfo && (
        <RecipeSelectorModal
          isOpen={true}
          onClose={() => setSelectorInfo(null)}
          onSelect={(recipe) => {
            handleChangeMeal(selectorInfo.dayIndex, selectorInfo.mealTime, recipe);
            setSelectorInfo(null);
          }}
        />
      )}
    </>
  );
};

export default EditMealPlanModal;
