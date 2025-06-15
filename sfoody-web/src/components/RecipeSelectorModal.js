import React, { useEffect, useState, useRef, useCallback } from 'react';
import RecipeModal from './RecipeModal';
import '../pages/HomePage.css';

const BASE_URL = process.env.REACT_APP_API;
const LIMIT = 10;

const RecipeSelectorModal = ({ isOpen, onClose, onSelect }) => {
  const [recipes, setRecipes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const listRef = useRef();

  // Debounce search input (300ms)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Reset when modal open or debouncedSearch changes
  useEffect(() => {
    if (isOpen) {
      setRecipes([]);
      setPage(1);
      setHasMore(true);
    }
  }, [isOpen, debouncedSearch]);

  // Fetch recipes
  const fetchRecipes = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/recipes?search=${encodeURIComponent(debouncedSearch)}&page=${page}&limit=${LIMIT}`
      );
      const data = await res.json();

      if (res.ok) {
        setRecipes(prev => {
            const existingIds = new Set(prev.map(r => r._id));
            const newRecipes = data.recipes.filter(r => !existingIds.has(r._id));
            return page === 1 ? data.recipes : [...prev, ...newRecipes];
        });
        setHasMore(data.recipes.length >= LIMIT);
      } else {
        console.error('Lỗi tải công thức:', data.error);
      }
    } catch (err) {
      console.error('Lỗi tải công thức:', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, hasMore, loading]);

  useEffect(() => {
    if (isOpen) {
      fetchRecipes();
    }
  }, [fetchRecipes, isOpen, page]);

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 10 && hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const handleSelect = (recipe) => {
    onSelect(recipe);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>🔍 Chọn món ăn</h2>

        <input
          type="text"
          className="search-input"
          placeholder="Tìm kiếm món ăn..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div
          className="recipe-list-scroll"
          onScroll={handleScroll}
          ref={listRef}
          style={{ maxHeight: '60vh', overflowY: 'auto' }}
        >
          {recipes.length > 0 ? (
            recipes.map((recipe) => (
              <div key={recipe._id} className="recipe-option">
                <img
                  src={recipe.image_url || '/placeholder.png'}
                  alt={recipe.title}
                  onClick={() => setSelected(recipe)}
                />
                <div className="info">
                  <strong>{recipe.title}</strong>
                  <p>⏱ {recipe.cook_time || 30} phút</p>
                  <button onClick={() => handleSelect(recipe)}>Chọn</button>
                </div>
              </div>
            ))
          ) : (
            !loading && <p>Không tìm thấy công thức phù hợp.</p>
          )}

          {loading && <p>Đang tải thêm món ăn...</p>}
        </div>

        {selected && (
          <RecipeModal recipe={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
};

export default RecipeSelectorModal;