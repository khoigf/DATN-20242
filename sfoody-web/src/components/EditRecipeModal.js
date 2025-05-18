import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import ToastNotification from './ToastNotification';

export default function EditRecipeModal({ recipe, onClose }) {
  const BASE_URL = process.env.REACT_APP_API;

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [tags, setTags] = useState([]);
  const [ingredients, setIngredients] = useState([]);

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

  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([{ id: '', quantity: '' }]);

  // Load tags + ingredients
  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/tags`).then(res => res.json()),
      fetch(`${BASE_URL}/ingredients`).then(res => res.json()),
    ])
      .then(([tagsData, ingredientsData]) => {
        setTags(tagsData);
        setIngredients(ingredientsData);
      })
      .catch(() => setToast('Lỗi tải tags hoặc nguyên liệu'));
  }, [BASE_URL]);

  // Load recipe detail
  useEffect(() => {
    if (!recipe._id) return;

    setLoading(true);
    fetch(`${BASE_URL}/recipes/${recipe._id}`)
      .then(res => {
        if (!res.ok) throw new Error('Lỗi tải công thức');
        return res.json();
      })
      .then(data => {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          instruction: data.instruction || '',
          prep_time: data.prep_time || '',
          cook_time: data.cook_time || '',
          servings: data.servings || '',
          image: null,
          video: null,
        });
        // Tags: data.tag_ids array of tag _id strings
        setSelectedTags(data.tags ? data.tags.map(t => t._id) : []);

        // Ingredients: data.ingredients is array of {id or ingredient._id, quantity}
        const mappedIngredients = (data.ingredients || []).map(ing => ({
          id: ing.ingredient?._id || ing._id || '',
          quantity: ing.quantity || '',
        }));
        setSelectedIngredients(mappedIngredients.length > 0 ? mappedIngredients : [{ id: '', quantity: '' }]);

        setLoading(false);
      })
      .catch(() => {
        setToast('Không tải được chi tiết công thức');
        setLoading(false);
      });
  }, [recipe._id, BASE_URL]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...selectedIngredients];
    updated[index][field] = value;
    setSelectedIngredients(updated);
  };

  const addIngredient = () => {
    setSelectedIngredients([...selectedIngredients, { id: '', quantity: '' }]);
  };

  const removeIngredient = (index) => {
    if (selectedIngredients.length <= 1) return;
    const updated = [...selectedIngredients];
    updated.splice(index, 1);
    setSelectedIngredients(updated);
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
    selectedTags.forEach(tagId => data.append('tag_ids[]', tagId));
    selectedIngredients.forEach(ing => {
      if (ing.id && ing.quantity) {
        data.append('ingredients[]', JSON.stringify({ id: ing.id, quantity: ing.quantity }));
      }
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
      setToast('Đã xảy ra lỗi!');
    }
  };

  return (
    <div className="Cmodal-overlay">
      <div className="Cmodal-container">
        <button className="close-btn" onClick={() => onClose(false)}>×</button>
        <h2 className="Cmodal-title">Chỉnh sửa công thức</h2>

        {loading ? (
          <p>Đang tải dữ liệu công thức...</p>
        ) : (
          <form onSubmit={handleSubmit} className="create-form">
            <input
              name="title"
              value={formData.title}
              placeholder="Tên món"
              onChange={handleChange}
              required
            />
            <textarea
              name="description"
              value={formData.description}
              placeholder="Mô tả ngắn"
              onChange={handleChange}
            />
            <textarea
              name="instruction"
              value={formData.instruction}
              placeholder="Hướng dẫn nấu"
              onChange={handleChange}
            />
            <input
              name="prep_time"
              type="number"
              value={formData.prep_time}
              placeholder="Thời gian chuẩn bị (phút)"
              onChange={handleChange}
            />
            <input
              name="cook_time"
              type="number"
              value={formData.cook_time}
              placeholder="Thời gian nấu (phút)"
              onChange={handleChange}
            />
            <input
              name="servings"
              type="number"
              value={formData.servings}
              placeholder="Khẩu phần ăn"
              onChange={handleChange}
            />

            <label>Chọn Tags:</label>
            <Select
              isMulti
              options={tags.map(tag => ({ value: tag._id, label: tag.name }))}
              value={tags
                .filter(tag => selectedTags.includes(tag._id))
                .map(tag => ({ value: tag._id, label: tag.name }))}
              onChange={selected => setSelectedTags(selected ? selected.map(item => item.value) : [])}
              placeholder="Chọn tag..."
              className="react-select-container"
              classNamePrefix="select"
            />

            <label>Nguyên liệu:</label>
            {selectedIngredients.map((ing, index) => (
              <div key={index} className="ingredient-row">
                <select
                  value={ing.id}
                  onChange={(e) => handleIngredientChange(index, 'id', e.target.value)}
                >
                  <option value="">{'-- Chọn nguyên liệu --'}</option>
                  {ingredients.map(i => (
                    <option key={i._id} value={i._id}>{i.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Số lượng"
                  value={ing.quantity}
                  onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                />
                {selectedIngredients.length > 1 && (
                  <button type="button" onClick={() => removeIngredient(index)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addIngredient}>+ Thêm nguyên liệu</button>

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
        )}
      </div>

      {toast && <ToastNotification message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
