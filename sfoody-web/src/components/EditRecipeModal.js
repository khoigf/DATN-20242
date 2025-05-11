import React, { useEffect, useState } from 'react';
import './CreatePostCard.css';
import ToastNotification from './ToastNotification';

export default function EditRecipeModal({ recipe, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instruction: '',
    prep_time: '',
    cook_time: '',
    servings: '',
    image: null,
    video: null,
  });
  const [toast, setToast] = useState('');
  const BASE_URL = process.env.REACT_APP_API;

  useEffect(() => {
    if (recipe) {
      setFormData({
        title: recipe.title || '',
        description: recipe.description || '',
        instruction: recipe.instruction || '',
        prep_time: recipe.prep_time || '',
        cook_time: recipe.cook_time || '',
        servings: recipe.servings || '',
        image: null,
        video: null,
      });
    }
  }, [recipe]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setToast('Bạn cần đăng nhập để chỉnh sửa bài.');
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });

    try {
      const res = await fetch(`${BASE_URL}/recipes/${recipe._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      if (!res.ok) throw new Error('Lỗi khi cập nhật công thức');
      setToast('Cập nhật công thức thành công!');
      setTimeout(() => onClose(true), 1500);
    } catch (err) {
      console.error(err);
      setToast('Đã xảy ra lỗi!');
    }
  };

  return (
    <div className="Cmodal-overlay">
      <div className="Cmodal-container">
        <button className="close-btn" onClick={() => onClose(false)}>×</button>
        <h2 className="Cmodal-title">Chỉnh sửa công thức</h2>
        <form onSubmit={handleSubmit} className="create-form">
          <input name="title" value={formData.title} placeholder="Tên món" onChange={handleChange} required />
          <textarea name="description" value={formData.description} placeholder="Mô tả ngắn" onChange={handleChange} />
          <textarea name="instruction" value={formData.instruction} placeholder="Hướng dẫn nấu" onChange={handleChange} />
          <input name="prep_time" type="number" value={formData.prep_time} placeholder="Thời gian chuẩn bị (phút)" onChange={handleChange} />
          <input name="cook_time" type="number" value={formData.cook_time} placeholder="Thời gian nấu (phút)" onChange={handleChange} />
          <input name="servings" type="number" value={formData.servings} placeholder="Khẩu phần ăn" onChange={handleChange} />
          <label>
            Ảnh món ăn (chọn mới để thay):
            <input type="file" name="image" accept="image/*" onChange={handleChange} />
          </label>
          <label>
            Video hướng dẫn (nếu muốn thay):
            <input type="file" name="video" accept="video/*" onChange={handleChange} />
          </label>
          <button type="submit">Lưu thay đổi</button>
        </form>
      </div>
      {toast && <ToastNotification message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
