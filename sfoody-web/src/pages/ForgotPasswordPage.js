import React, { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    setMessage(data.msg || 'Gửi email thất bại');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form className="bg-white p-6 rounded shadow w-full max-w-md" onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-4">Quên mật khẩu</h2>
        <input type="email" className="w-full p-2 mb-3 border rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button className="w-full bg-blue-600 text-white py-2 rounded">Gửi yêu cầu</button>
        {message && <p className="mt-4 text-green-600">{message}</p>}
      </form>
    </div>
  );
}