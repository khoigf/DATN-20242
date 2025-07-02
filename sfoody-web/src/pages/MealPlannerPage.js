import React, { useState, useEffect } from 'react';
import './HomePage.css';
import Sidebar from '../components/HomeSidebar';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';
import MealPlanCard from '../components/MealPlanCard';
import ConfirmDialog from '../components/ConfirmDialog';
import RecipeModal from '../components/RecipeModal';
import ToastNotification from '../components/ToastNotification';
import EditMealPlanModal from '../components/EditMealPlanModal';
import Select from 'react-select';
import { useNavigate, Link } from 'react-router-dom';

const BASE_URL = process.env.REACT_APP_API;

const MealPlannerPage = () => {
  const [confirmDialog, setConfirmDialog] = useState(null);
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
  const [savedPlans, setSavedPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState('');
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [resTags, resIngredients, resPlans] = await Promise.all([
        fetch(`${BASE_URL}/tags`),
        fetch(`${BASE_URL}/ingredients`),
        fetch(`${BASE_URL}/meal-plans`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setTags(await resTags.json());
      setIngredients(await resIngredients.json());
      const saved = await resPlans.json();
      setSavedPlans(saved);
    };
    fetchData();
  }, [token]);

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
        body: JSON.stringify({ days: constraints.days, constraints: { ...constraints, save: false } }),
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
      if (res.ok) {
        setSuccess(true);
        setToast('Đã lưu thực đơn!');
        setSavedPlans(prev => [data, ...prev]);
      } else {
        setError(data.message || 'Lỗi khi lưu thực đơn.');
      }
    } catch {
      setError('Lỗi mạng.');
    }
  };

  const handleDeletePlan = (id) => {
    setConfirmDialog({
      title: 'Xác nhận xoá',
      message: 'Bạn có chắc chắn muốn xoá thực đơn này không?',
      onConfirm: async () => {
        try {
          const res = await fetch(`${BASE_URL}/meal-plans/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            setSavedPlans(prev => prev.filter(plan => plan._id !== id));
          } else {
            const error = await res.json();
            console.error('Xoá thất bại:', error.message);
          }
        } catch (err) {
          console.error('Lỗi khi xoá:', err);
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
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

      <div className="home-content meal-planner-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} token={token} role={role} />

        <main className="main-content">
          <h2 className="section-title">📚 Thực đơn đã lưu</h2>
          <div className="saved-plans">
            {savedPlans.map(plan => (
              <MealPlanCard
                key={plan._id}
                plan={plan}
                onDelete={handleDeletePlan}
                onEdit={() => setEditingPlan(plan)}
                onViewRecipe={(recipe) => setActiveRecipe(recipe)}
              />
            ))}
          </div>

          <div className="meal-grid">
            <div className="planner-column">
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
                    styles={{
                      option: (provided, state) => ({
                        ...provided,
                        color: 'black',
                        backgroundColor: state.isFocused
                          ? '#e2e8f0' // màu hover nhạt
                          : 'white',  // màu nền dropdown
                      }),
                      multiValueLabel: (provided) => ({
                        ...provided,
                        color: 'black',
                      }),
                      multiValueRemove: (provided) => ({
                        ...provided,
                        color: 'black',
                      }),
                    }}
                  />
                </div>
                <div className="meal-form-group">
                  <label>🏷️ Loại bỏ tags</label>
                  <Select
                    isMulti
                    options={tags.map(tag => ({ value: tag._id, label: tag.name }))}
                    onChange={(selected) => handleSelectChange(selected, 'exclude_tags')}
                    styles={{
                      option: (provided, state) => ({
                        ...provided,
                        color: 'black',
                        backgroundColor: state.isFocused
                          ? '#e2e8f0' // màu hover nhạt
                          : 'white',  // màu nền dropdown
                      }),
                      multiValueLabel: (provided) => ({
                        ...provided,
                        color: 'black',
                      }),
                      multiValueRemove: (provided) => ({
                        ...provided,
                        color: 'black',
                      }),
                    }}
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
            </div>
            <div className="suggested-column">
              <h2 className="section-title">📋 Kết quả gợi ý</h2>
              <div className="suggested-plans">
                {suggestedPlans.map((plan, index) => (
                  <div key={index} className="suggested-day">
                    <h3>🗓️ Ngày {new Date(plan.date).toLocaleDateString('vi-VN')}</h3>
                    <div className="suggested-meals">
                      {plan.meals.map((meal, idx) => (
                        <div key={idx} className="suggested-meal">
                          <strong>{meal.meal_time === 'breakfast' ? '🍳 Sáng' : meal.meal_time === 'lunch' ? '🍛 Trưa' : '🍲 Tối'}:</strong>
                          {meal.recipe_id ? (
                            <div>
                              <div
                                className="Mrecipe-preview"
                                onClick={() =>
                                  setActiveRecipe(
                                    meal.recipe,
                                  )
                                }
                                style={{ cursor: 'pointer' }}
                              >
                                <img
                                  src={
                                    meal.recipe.image_url || '/placeholder.png'
                                  }
                                  alt=""
                                />
                                <div>
                                  <strong className="Mname">
                                    {meal.recipe.title}
                                  </strong>
                                  <p>
                                    ⏱{' '}
                                    {
                                    meal.recipe.cook_time
                                    }{' '}
                                    phút
                                  </p>
                                </div>
                              </div>
                              <span style={{ fontSize: '0.85em', color: 'green', marginLeft: '10px' }}>
                                {meal.nutrition_tags?.length ? `✔️ Đạt: ${meal.nutrition_tags.join(', ')}` : ''}
                              </span>
                              <div>
                                <span style={{ fontSize: '0.85em', color: 'red', marginLeft: '10px' }}>
                                  {meal.reason ? `Lý do: ${meal.reason}` : ''}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: 'gray', fontStyle: 'italic' }}>
                              ⚠️ Không có món phù hợp ({meal.reason || 'Không đủ nhóm dinh dưỡng'})
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {suggestedPlans.length > 0 && (
                <div className="load-more">
                  <button onClick={handleConfirm}>✅ Xác nhận và lưu</button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      {editingPlan && (
        <EditMealPlanModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSave={(updated) => {
            setSavedPlans(prev => prev.map(p => (p._id === updated._id ? updated : p)));
            setEditingPlan(null);
          }}
        />
      )}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}

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