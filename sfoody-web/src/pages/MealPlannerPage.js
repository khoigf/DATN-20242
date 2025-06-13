import React, { useState } from 'react';
import './HomePage.css'; // Reuse HomePage style
import Sidebar from '../components/HomeSidebar';
import UserMenu from '../components/UserMenu';
import NotificationBell from '../components/NotificationBell';
import MealPlanCard from '../components/MealPlanCard';
import { useNavigate, Link } from 'react-router-dom';

const BASE_URL = process.env.REACT_APP_API;

const MealPlannerPage = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
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
  const navigate = useNavigate();

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
          user_id: localStorage.getItem('user_id'),
          days: constraints.days,
          constraints: { ...constraints, save: false }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuggestedPlans(data);
      } else {
        setError(data.message || 'Đã xảy ra lỗi.');
      }
    } catch (err) {
      setError('Lỗi mạng.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');    
    navigate('/login');
  };

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
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.message || 'Lỗi khi lưu thực đơn.');
      }
    } catch (err) {
      setError('Lỗi mạng.');
    }
  };

  return (
    <div className="home-container">
      <header className="header">
        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        <Link to="/"> 
          <h1 className="header-title">S-Foody</h1>
        </Link>
        <h1 className="header-title">Lập thực đơn</h1>
        { token && (
                  <div className="auth-actions">
                    <UserMenu onLogout={handleLogout} />
                    <NotificationBell token={token} />
                  </div>)}
                {!token && (
                  <button className="login-button" onClick={() => navigate('/login')}>Đăng nhập</button>
                )}
      </header>

      <div className="home-content">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} token={token} role={role} />

        <main className="main-content">
          <h2 className="section-title">Thiết lập yêu cầu</h2>
          <div className="suggestion-card">
            <div className="form-section">
              <label>Số ngày:
                <input type="number" name="days" value={constraints.days} onChange={handleInputChange} />
              </label>
              <label>Hồ sơ:
                <select name="profile" value={constraints.profile} onChange={handleInputChange}>
                  <option value="">--Chọn--</option>
                  <option value="gym">Tập gym</option>
                  <option value="sick">Người ốm</option>
                  <option value="elder">Người cao tuổi</option>
                  <option value="child">Trẻ em</option>
                </select>
              </label>
              <label><input type="checkbox" name="balance" checked={constraints.balance} onChange={handleInputChange} /> Cân bằng dinh dưỡng</label>
              <label><input type="checkbox" name="no_repeat" checked={constraints.no_repeat} onChange={handleInputChange} /> Không trùng món</label>
              <label>Thời gian nấu tối đa:
                <select name="max_cook_time" value={constraints.max_cook_time} onChange={handleInputChange}>
                  <option value="">--Không giới hạn--</option>
                  <option value="Dưới 15 phút">Dưới 15 phút</option>
                  <option value="15 - 30 phút">15 - 30 phút</option>
                  <option value="30 - 60 phút">30 - 60 phút</option>
                </select>
              </label>
              <label>Loại bỏ nguyên liệu: 
                <input type="text" placeholder="vd: tỏi, hành" onChange={(e) => handleArrayInput(e, 'exclude_ingredients')} />
              </label>
              <label>Loại bỏ tags: 
                <input type="text" placeholder="vd: chiên, ngọt" onChange={(e) => handleArrayInput(e, 'exclude_tags')} />
              </label>
              <button onClick={handleSuggest} disabled={loading}>
                {loading ? 'Đang gợi ý...' : 'Gợi ý thực đơn'}
              </button>
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}
          {success && <div className="success-box">✅ Lưu thực đơn thành công!</div>}

          <h2 className="section-title">Kết quả gợi ý</h2>
          <div className="recipe-grid">
            {suggestedPlans.map((plan, index) => (
              <MealPlanCard key={index} plan={plan} />
            ))}
          </div>

          {suggestedPlans.length > 0 && (
            <div className="load-more">
              <button onClick={handleConfirm}>Xác nhận và lưu</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MealPlannerPage;