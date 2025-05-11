import React, { useState } from 'react';
import './CreatePostCard.css';
import ToastNotification from './ToastNotification';

export default function CreateRecipeModal({ onClose }) {
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
      setToast('Bạn cần đăng nhập để đăng bài.');
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });

    try {
      const res = await fetch(`${BASE_URL}/recipes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      if (!res.ok) throw new Error('Lỗi khi đăng bài');
      setToast('Tạo công thức thành công!');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error(err);
      setToast('Đã xảy ra lỗi!');
    }
  };

  return (
    <div className="Cmodal-overlay">
      <div className="Cmodal-container">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2 className="Cmodal-title">Tạo công thức mới</h2>
        <form onSubmit={handleSubmit} className="create-form">
          <input name="title" placeholder="Tên món" onChange={handleChange} required />
          <textarea name="description" placeholder="Mô tả ngắn" onChange={handleChange} />
          <textarea name="instruction" placeholder="Hướng dẫn nấu" onChange={handleChange} />
          <input name="prep_time" placeholder="Thời gian chuẩn bị (phút)" type="number" onChange={handleChange} />
          <input name="cook_time" placeholder="Thời gian nấu (phút)" type="number" onChange={handleChange} />
          <input name="servings" placeholder="Khẩu phần ăn" type="number" onChange={handleChange} />
          <label>
            Ảnh món ăn:
            <input type="file" name="image" accept="image/*" onChange={handleChange} />
          </label>
          <label>
            Video hướng dẫn (nếu có):
            <input type="file" name="video" accept="video/*" onChange={handleChange} />
          </label>
          <button type="submit">Đăng bài</button>
        </form>
      </div>
      {toast && <ToastNotification message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
