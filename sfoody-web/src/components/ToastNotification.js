import React, { useEffect } from 'react';
import './ToastNotification.css';

export default function ToastNotification({ message, onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="toast-notification">
      {message}
    </div>
  );
}
