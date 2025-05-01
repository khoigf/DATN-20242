import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);

  useEffect(() => {
    fetch(`/api/recipes/${id}`)
      .then(res => res.json())
      .then(data => setRecipe(data));
  }, [id]);

  if (!recipe) return <div className="text-center mt-10">Đang tải...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <img src={recipe.image_url || '/default-recipe.jpg'} alt={recipe.title} className="w-full h-64 object-cover rounded mb-4" />
      <h1 className="text-2xl font-bold mb-2 text-green-700">{recipe.title}</h1>
      <p className="text-gray-700 mb-4">{recipe.description}</p>
      <div className="prose max-w-full">
        <h2>Hướng dẫn</h2>
        <p>{recipe.instruction}</p>
      </div>
    </div>
  );
}
