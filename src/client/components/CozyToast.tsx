import React, { useEffect } from 'react';

interface CozyToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const CozyToast = ({
  message,
  type = 'success',
  onClose,
  duration = 3000,
}: CozyToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: '✨',
    error: '⚠️',
    info: '☕',
  };

  const borders = {
    success: 'var(--color-accent-amber)',
    error: '#cf2929',
    info: 'var(--color-coffee-latte)',
  };

  const shadows = {
    success: 'var(--color-accent-gold)',
    error: '#a81212',
    info: 'var(--color-wood-light)',
  };

  return (
    <div
      className="cozy-toast select-none"
      style={{
        borderColor: borders[type],
        boxShadow: `4px 4px 0px ${shadows[type]}`,
      }}
    >
      <span>{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
};
