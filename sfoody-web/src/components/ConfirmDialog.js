import React from 'react';
import './ConfirmDialog.css';

export default function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn danger" onClick={onConfirm}>Xác nhận</button>
          <button className="confirm-btn" onClick={onCancel}>Hủy</button>
        </div>
      </div>
    </div>
  );
}
