import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RecipeModal from '../components/RecipeModal';
import RecipeSelectorModal from '../components/RecipeSelectorModal';
import ToastNotification from '../components/ToastNotification';
import '../pages/HomePage.css';

const BASE_URL = process.env.REACT_APP_API;

const EditMealPlanPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [plan, setPlan] = useState(null);
  const [recipes, setRecipes] = useState({});
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectingMeal, setSelectingMeal] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`${BASE_URL}/meal-plans/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setPlan(data);
          const newRecipes = {};
          for (let meal of data.meals) {
            if (meal.recipe_id) {
              const res = await fetch(`${BASE_URL}/recipes/${meal.recipe_id}`);
              const recipe = await res.json();
              if (res.ok) newRecipes[meal.meal_time] = recipe;
            }
          }
          setRecipes(newRecipes);
        } else {
          setToast({ show: true, message: data.message || 'Không tìm thấy thực đơn', type: 'error' });
        }
      } catch {
        setToast({ show: true, message: 'Lỗi khi tải thực đơn', type: 'error' });
      }
    };
    fetchPlan();
  }, [id, token]);

  const handleChangeMeal = (mealTime, recipe) => {
    setPlan(prev => ({
      ...prev,
      meals: prev.meals.map(m => m.meal_time === mealTime ? { ...m, recipe_id: recipe._id } : m)
    }));
    setRecipes(prev => ({ ...prev, [mealTime]: recipe }));
    setSelectingMeal(null);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${BASE_URL}/meal-plans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(plan)
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ show: true, message: '✅ Cập nhật thành công!', type: 'success' });
      } else {
        setToast({ show: true, message: data.message || '❌ Cập nhật thất bại!', type: 'error' });
      }
    } catch {
      setToast({ show: true, message: '❌ Lỗi mạng!', type: 'error' });
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm('Bạn chắc chắn muốn xoá thực đơn này?');
    if (!confirm) return;
    try {
      const res = await fetch(`${BASE_URL}/meal-plans/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setToast({ show: true, message: '🗑️ Đã xoá thực đơn', type: 'success' });
        setTimeout(() => navigate('/meal-plans'), 1500);
      } else {
        const data = await res.json();
        setToast({ show: true, message: data.message || '❌ Xoá thất bại', type: 'error' });
      }
    } catch {
      setToast({ show: true, message: '❌ Lỗi mạng khi xoá', type: 'error' });
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  if (!plan) return <div className="loading">⏳ Đang tải thực đơn...</div>;

  return (
    <div className="home-container">
      <div className="home-content">
        <main className="main-content">
          <h2 className="section-title">🛠️ Chỉnh sửa thực đơn - {formatDate(plan.date)}</h2>
          <div className="recipe-grid">
            {['breakfast', 'lunch', 'dinner'].map(meal => (
              <div key={meal} className="meal-item-edit">
                <h3>
                  {meal === 'breakfast' ? '🍳 Bữa sáng' : meal === 'lunch' ? '🍛 Bữa trưa' : '🍲 Bữa tối'}
                </h3>
                {recipes[meal] ? (
                  <div className="Mrecipe-preview" onClick={() => setSelectedRecipe(recipes[meal])}>
                    <img src={recipes[meal].image_url || '/placeholder.png'} alt="ảnh món" />
                    <strong>{recipes[meal].title}</strong>
                  </div>
                ) : <p>(Chưa chọn món)</p>}

                <button onClick={() => setSelectingMeal(meal)}>
                  {recipes[meal] ? '📝 Đổi món' : '➕ Chọn món'}
                </button>
              </div>
            ))}
          </div>

          <div className="load-more">
            <button className="save-btn" onClick={handleSave}>💾 Lưu thay đổi</button>
            <button className="delete-btn" onClick={handleDelete}>🗑️ Xoá thực đơn</button>
          </div>
        </main>
      </div>

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {selectingMeal && (
        <RecipeSelectorModal
          onSelect={(recipe) => handleChangeMeal(selectingMeal, recipe)}
          onClose={() => setSelectingMeal(null)}
        />
      )}

      {toast.show && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
};

export default EditMealPlanPage;