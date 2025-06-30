'use client';

import React, { useEffect } from 'react';
import '../../styles/components/Toast.css';

interface Props {
  message: string;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<Props> = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="toast-container">
      <div className="toast">
        <span className="toast-message">{message}</span>
        <button className="toast-close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
