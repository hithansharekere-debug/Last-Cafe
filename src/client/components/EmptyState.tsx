import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  icon = '📜',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full py-12 select-none text-center px-6">
      {/* Icon Badge */}
      <div
        className="flex items-center justify-center rounded-full select-none"
        style={{
          width: '54px',
          height: '54px',
          backgroundColor: '#FBF6EE',
          border: '2px solid #8D6846',
          boxShadow: '0 3px 6px rgba(59, 39, 28, 0.08)',
          fontSize: '24px',
          marginBottom: '16px',
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3 
        className="font-sans font-bold text-[24px] text-[#4B3528] leading-tight"
        style={{ marginBottom: '8px' }}
      >
        {title}
      </h3>

      {/* Description */}
      <p 
        className="font-sans text-[16px] text-[#8D6846] leading-relaxed max-w-md"
        style={{ marginBottom: actionLabel ? '16px' : '0' }}
      >
        {message}
      </p>

      {/* Optional action */}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
