import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      alert('Đăng ký thành công');
      navigate('/login');
    } else {
      alert(data.msg || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form className="bg-white p-6 rounded-md shadow-md w-full max-w-sm" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4">Đăng ký</h2>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tên người dùng" className="mb-3 w-full p-2 border rounded" required />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="mb-3 w-full p-2 border rounded" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" className="mb-4 w-full p-2 border rounded" required />
        <button className="w-full bg-green-600 text-white py-2 rounded">Đăng ký</button>
      </form>
    </div>
  );
}
