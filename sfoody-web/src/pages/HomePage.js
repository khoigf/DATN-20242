import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function HomePage() {
  const [recipes, setRecipes] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch('/api/recipes')
      .then(res => res.json())
      .then(data => setRecipes(data));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="mb-6 flex justify-between items-center">
        <div className="text-center w-full">
          <h1 className="text-3xl md:text-4xl font-bold text-green-600">S-Foody - Khám phá công thức nấu ăn</h1>
          <p className="text-gray-600 mt-2">Cùng cộng đồng chia sẻ những món ăn ngon mỗi ngày</p>
        </div>
        <div className="absolute right-4 top-4 space-x-2">
          {token ? (
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded">Đăng xuất</button>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded">Đăng nhập</Link>
              <Link to="/register" className="px-4 py-2 bg-green-600 text-white rounded">Đăng ký</Link>
            </>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {recipes.map(recipe => (
          <Link to={`/recipes/${recipe._id}`} key={recipe._id} className="bg-white rounded shadow hover:shadow-lg transition duration-200">
            <img src={recipe.image_url || '/default-recipe.jpg'} alt={recipe.title} className="w-full h-48 object-cover rounded-t" />
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-800 line-clamp-1">{recipe.title}</h2>
              <p className="text-sm text-gray-500 line-clamp-2">{recipe.description}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
