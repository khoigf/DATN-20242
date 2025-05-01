import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: searchParams.get('token'), newPassword: password })
    });
    const data = await res.json();
    setMessage(data.msg || 'Lỗi khi đặt lại mật khẩu');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form className="bg-white p-6 rounded shadow w-full max-w-md" onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-4">Đặt lại mật khẩu</h2>
        <input type="password" className="w-full p-2 mb-3 border rounded" placeholder="Mật khẩu mới" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="w-full bg-green-600 text-white py-2 rounded">Xác nhận</button>
        {message && <p className="mt-4 text-green-600">{message}</p>}
      </form>
    </div>
  );
}
