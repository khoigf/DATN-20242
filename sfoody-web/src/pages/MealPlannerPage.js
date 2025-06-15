import React, { useState, useEffect } from 'react';
import './HomePage.css';
import Sidebar from '../components/HomeSidebar';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';
import MealPlanCard from '../components/MealPlanCard';
import RecipeModal from '../components/RecipeModal';
import Select from 'react-select';
import ToastNotification from '../components/ToastNotification';
import { useNavigate, Link } from 'react-router-dom';

const BASE_URL = process.env.REACT_APP_API;

const MealPlannerPage = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [constraints, setConstraints] = useState({
    days: 7,
    profile: '',
    balance: false,
    no_repeat: false,
    max_cook_time: '',
    exclude_tags: [],
    exclude_ingredients: [],
  });
  const [tags, setTags] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [suggestedPlans, setSuggestedPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState('');
  const [activeRecipe, setActiveRecipe] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const resTags = await fetch(`${BASE_URL}/tags`);
      const resIngredients = await fetch(`${BASE_URL}/ingredients`);
      setTags(await resTags.json());
      setIngredients(await resIngredients.json());
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConstraints(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSelectChange = (selected, key) => {
    setConstraints(prev => ({ ...prev, [key]: selected.map(opt => opt.value) }));
  };

  const handleSuggest = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch(`${BASE_URL}/meal-plans/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({days: constraints.days, constraints: { ...constraints, save: false } }),
      });
      const data = await res.json();
      if (res.ok) setSuggestedPlans(data);
      else setError(data.message || 'Đã xảy ra lỗi.');
    } catch {
      setError('Lỗi mạng.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      const res = await fetch(`${BASE_URL}/meal-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(suggestedPlans),
      });
      const data = await res.json();
      if (res.ok) setSuccess(true);
      else setError(data.message || 'Lỗi khi lưu thực đơn.');
    } catch {
      setError('Lỗi mạng.');
    }
  };

  const handleDeleteMeal = (dayIndex, mealTime) => {
    const updated = [...suggestedPlans];
    const meals = updated[dayIndex].meals.map(m => m.meal_time === mealTime ? { ...m, recipe_id: null } : m);
    updated[dayIndex].meals = meals;
    setSuggestedPlans(updated);
  };

  const handleEditMeal = (dayIndex, mealTime, newRecipeId) => {
    const updated = [...suggestedPlans];
    const meals = updated[dayIndex].meals.map(m => m.meal_time === mealTime ? { ...m, recipe_id: newRecipeId } : m);
    updated[dayIndex].meals = meals;
    setSuggestedPlans(updated);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="home-container">
      <header className="header">
        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        <Link to="/"><h1 className="header-title">S-Foody</h1></Link>
        <div className="auth-actions">
          {token ? (<><UserMenu onLogout={handleLogout} /><NotificationBell token={token} /></>) : <button onClick={() => navigate('/login')}>Đăng nhập</button>}
        </div>
      </header>

      <div className="home-content">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} token={token} role={role} />

        <main className="main-content">
          <h2 className="section-title">📝 Lập thực đơn</h2>
          <div className="meal-setup-card">
            <div className="meal-form-group">
              <label>Số ngày</label>
              <input type="number" name="days" value={constraints.days} onChange={handleInputChange} />
            </div>
            <div className="meal-form-group">
              <label>Hồ sơ người dùng</label>
              <select name="profile" value={constraints.profile} onChange={handleInputChange}>
                <option value="">-- Chọn hồ sơ --</option>
                <option value="gym">🏋️ Tập gym</option>
                <option value="sick">🤒 Người ốm</option>
                <option value="elder">👴 Người cao tuổi</option>
                <option value="child">🧒 Trẻ em</option>
              </select>
            </div>
            <div className="meal-form-group checkbox-list">
              <label><input type="checkbox" name="balance" checked={constraints.balance} onChange={handleInputChange} /> ⚖️ Cân bằng</label>
              <label><input type="checkbox" name="no_repeat" checked={constraints.no_repeat} onChange={handleInputChange} /> 🔁 Không trùng món</label>
            </div>
            <div className="meal-form-group">
              <label>⏱️ Thời gian nấu tối đa</label>
              <select name="max_cook_time" value={constraints.max_cook_time} onChange={handleInputChange}>
                <option value="">-- Không giới hạn --</option>
                <option value="Dưới 15 phút">Dưới 15 phút</option>
                <option value="15 - 30 phút">15 - 30 phút</option>
                <option value="30 - 60 phút">30 - 60 phút</option>
              </select>
            </div>
            <div className="meal-form-group">
              <label>❌ Loại bỏ nguyên liệu</label>
              <Select
                isMulti
                options={ingredients.map(ing => ({ value: ing._id, label: ing.name }))}
                onChange={(selected) => handleSelectChange(selected, 'exclude_ingredients')}
              />
            </div>
            <div className="meal-form-group">
              <label>🏷️ Loại bỏ tags</label>
              <Select
                isMulti
                options={tags.map(tag => ({ value: tag._id, label: tag.name }))}
                onChange={(selected) => handleSelectChange(selected, 'exclude_tags')}
              />
            </div>
            <div className="meal-form-actions">
              <button className="suggest-btn" onClick={handleSuggest} disabled={loading}>
                {loading ? '⏳ Đang gợi ý...' : '✨ Gợi ý thực đơn'}
              </button>
            </div>
          </div>

          {error && <div className="error-box">❌ {error}</div>}
          {success && <div className="success-box">✅ Lưu thực đơn thành công!</div>}

          <h2 className="section-title">📋 Kết quả gợi ý</h2>
          <div className="recipe-grid">
            {suggestedPlans.map((plan, index) => (
              <MealPlanCard
                key={index}
                plan={plan}
                onDeleteMeal={(mealTime) => handleDeleteMeal(index, mealTime)}
                onEditMeal={(mealTime, newRecipeId) => handleEditMeal(index, mealTime, newRecipeId)}
                onViewRecipe={(recipe) => setActiveRecipe(recipe)}
              />
            ))}
          </div>

          {suggestedPlans.length > 0 && (
            <div className="load-more">
              <button onClick={handleConfirm}>✅ Xác nhận và lưu</button>
            </div>
          )}
        </main>
      </div>

      {activeRecipe && (
        <RecipeModal
          recipe={activeRecipe}
          onClose={() => setActiveRecipe(null)}
        />
      )}

      {toast && <ToastNotification message={toast} onClose={() => setToast('')} />}
    </div>
  );
};

export default MealPlannerPage;