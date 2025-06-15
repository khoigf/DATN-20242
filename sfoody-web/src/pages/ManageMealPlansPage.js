import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MealPlanCard from '../components/MealPlanCard';
import ToastNotification from '../components/ToastNotification';

const BASE_URL = process.env.REACT_APP_API;

export default function ManageMealPlansPage() {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const [mealPlans, setMealPlans] = useState([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${BASE_URL}/meal-plans`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setMealPlans(data);
        else setToast('Không thể tải danh sách thực đơn');
      } catch {
        setToast('Lỗi mạng');
      }
    };
    fetchPlans();
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xoá thực đơn này?')) return;
    try {
      const res = await fetch(`${BASE_URL}/meal-plans/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMealPlans(prev => prev.filter(p => p._id !== id));
        setToast('🗑️ Đã xoá thành công!');
      } else {
        setToast('❌ Không thể xoá!');
      }
    } catch {
      setToast('Lỗi mạng khi xoá');
    }
  };

  const handleEdit = (id) => {
    navigate(`/meal-plans/edit/${id}`);
  };

  return (
    <div className="manage-mealplans-page">
      <h2 className="section-title">📚 Quản lý thực đơn đã lưu</h2>
      <div className="mealplan-list">
        {mealPlans.length === 0 ? (
          <p>Chưa có thực đơn nào.</p>
        ) : mealPlans.map(plan => (
          <div key={plan._id} className="mealplan-item">
            <MealPlanCard plan={plan} readonly />
            <div className="actions">
              <button onClick={() => handleEdit(plan._id)}>✏️ Sửa</button>
              <button onClick={() => handleDelete(plan._id)}>🗑️ Xoá</button>
            </div>
          </div>
        ))}
      </div>
      {toast && <ToastNotification message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
