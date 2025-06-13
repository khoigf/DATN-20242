import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import './CreatePostCard.css';
import ToastNotification from './ToastNotification';

export default function CreateRecipeModal({ onClose }) {
  const [formData, setFormData] = useState({
    title: '', description: '', instruction: '', prep_time: '', cook_time: '', servings: '', image: null, video: null,
  });
  const [tags, setTags] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [ingredientFields, setIngredientFields] = useState([{ ingredient_id: '', quantity: '' }]);
  const [toast, setToast] = useState('');
  const BASE_URL = process.env.REACT_APP_API;

  useEffect(() => {
    const fetchData = async () => {
      const resTags = await fetch(`${BASE_URL}/tags`);
      const resIngredients = await fetch(`${BASE_URL}/ingredients`);
      setTags(await resTags.json());
      setIngredients(await resIngredients.json());
    };
    fetchData();
  }, [BASE_URL]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) setFormData((prev) => ({ ...prev, [name]: files[0] }));
    else setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIngredientChange = (index, e) => {
    const { name, value } = e.target;
    const newFields = [...ingredientFields];
    newFields[index][name] = value;
    setIngredientFields(newFields);
  };

  const removeIngredientField = (index) => {
    const newFields = [...ingredientFields];
    newFields.splice(index, 1);
    setIngredientFields(newFields);
  };

  const addIngredientField = () => {
    setIngredientFields([...ingredientFields, { ingredient_id: '', quantity: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return setToast('Bạn cần đăng nhập để đăng bài.');

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => { if (value) data.append(key, value); });
    data.append('tag_ids', JSON.stringify(selectedTags));
    data.append('ingredients', JSON.stringify(ingredientFields));

    try {
      const res = await fetch(`${BASE_URL}/recipes`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: data
      });
      if (!res.ok) throw new Error();
      setToast('Tạo công thức thành công!');
      setTimeout(() => onClose(), 1500);
    } catch {
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
          <label>Ảnh món ăn:<input type="file" name="image" accept="image/*" onChange={handleChange} /></label>
          <label>
            Video YouTube (tùy chọn):
            <input
              type="text"
              name="video_url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={formData.video_url || ''}
              onChange={handleChange}
          />
          </label>
          <label>Chọn thẻ (tags):</label>
          <Select
            isMulti
            options={tags.map(tag => ({ value: tag._id, label: tag.name }))}
            value={tags
              .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
              .filter(tag => selectedTags.includes(tag._id)).map(tag => ({
              value: tag._id,
              label: tag.name
            }))}
            onChange={(selected) => setSelectedTags(selected.map(item => item.value))}
            placeholder="Chọn tag..."
            className="react-select-container"
            classNamePrefix="select"
            styles={{
                control: (provided) => ({
                  ...provided,
                  color: 'black',
                }),
                singleValue: (provided) => ({
                  ...provided,
                  color: 'black',
                }),
                input: (provided) => ({
                  ...provided,
                  color: 'black',
                }),
                placeholder: (provided) => ({
                  ...provided,
                  color: 'black',
                }),
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

          <label>Nguyên liệu:</label>
          {ingredientFields.map((field, idx) => (
            <div key={idx} className="ingredient-field">
              <select name="ingredient_id" value={field.ingredient_id} onChange={e => handleIngredientChange(idx, e)}>
                <option value="">-- Chọn nguyên liệu --</option>
                {ingredients
                  .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
                  .map(ing => (
                  <option key={ing._id} value={ing._id}>{ing.name}</option>
                ))}
              </select>
              <input type="text" name="quantity" placeholder="Số lượng" value={field.quantity} onChange={e => handleIngredientChange(idx, e)} />
              {ingredientFields.length > 1 && (
                <button type="button" onClick={() => removeIngredientField(idx)}>✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addIngredientField}>+ Thêm nguyên liệu</button>
          <button type="submit">Đăng bài</button>
        </form>
      </div>
      {toast && <ToastNotification message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
