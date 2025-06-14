import React, { useState } from 'react';
import './HomePage.css';
import Sidebar from '../components/HomeSidebar';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';
import MealPlanCard from '../components/MealPlanCard';
import { useNavigate, Link } from 'react-router-dom';

const BASE_URL = process.env.REACT_APP_API;

const MealPlannerPage = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const userId = localStorage.getItem('user_id');
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

  const [suggestedPlans, setSuggestedPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // --- HANDLE FORM ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConstraints(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayInput = (e, key) => {
    const values = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    setConstraints(prev => ({ ...prev, [key]: values }));
  };

  // --- HANDLE SUGGEST ---
  const handleSuggest = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch(`${BASE_URL}/meal-plans/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          days: constraints.days,
          constraints: { ...constraints, save: false }
        })
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

  // --- CONFIRM AND SAVE PLAN ---
  const handleConfirm = async () => {
    try {
      const res = await fetch(`${BASE_URL}/meal-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(suggestedPlans)
      });
      const data = await res.json();
      if (res.ok) setSuccess(true);
      else setError(data.message || 'Lỗi khi lưu thực đơn.');
    } catch {
      setError('Lỗi mạng.');
    }
  };

  // --- DELETE A MEAL ---
  const handleDeleteMeal = (dayIndex, mealTime) => {
    const updated = [...suggestedPlans];
    const meals = updated[dayIndex].meals.map(m => m.meal_time === mealTime ? { ...m, recipe_id: null } : m);
    updated[dayIndex].meals = meals;
    setSuggestedPlans(updated);
  };

  // --- EDIT A MEAL ---
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
          {token ? (
            <>
              <UserMenu onLogout={handleLogout} />
              <NotificationBell token={token} />
            </>
          ) : <button onClick={() => navigate('/login')}>Đăng nhập</button>}
        </div>
      </header>

      <div className="home-content">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} token={token} role={role} />

        <main className="main-content">
          {/* ==== FORM LẬP KẾ HOẠCH ==== */}
          <h2 className="section-title">📝 Lập thực đơn</h2>
          <div className="meal-setup-card">
            <h3 className="meal-form-title">⚙️ Tùy chọn thực đơn</h3>

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
              <input type="text" placeholder="vd: tỏi, hành" onChange={(e) => handleArrayInput(e, 'exclude_ingredients')} />
            </div>

            <div className="meal-form-group">
              <label>🏷️ Loại bỏ tags</label>
              <input type="text" placeholder="vd: chiên, ngọt" onChange={(e) => handleArrayInput(e, 'exclude_tags')} />
            </div>

            <div className="meal-form-actions">
              <button className="suggest-btn" onClick={handleSuggest} disabled={loading}>
                {loading ? '⏳ Đang gợi ý...' : '✨ Gợi ý thực đơn'}
              </button>
            </div>
          </div>

          {/* ==== KẾT QUẢ ==== */}
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
    </div>
  );
};

export default MealPlannerPage;
