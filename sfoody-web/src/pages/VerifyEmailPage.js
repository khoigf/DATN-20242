import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Đang xác minh...');

  useEffect(() => {
    const token = searchParams.get('token');
    fetch(`/api/auth/verify?token=${token}`)
      .then(res => res.json())
      .then(data => setMessage(data.msg || 'Lỗi xác minh'))
      .catch(() => setMessage('Xác minh thất bại'));
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">{message}</h2>
      </div>
    </div>
  );
}