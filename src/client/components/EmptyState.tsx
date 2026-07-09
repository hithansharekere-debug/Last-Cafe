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
    <div className="flex flex-col items-center justify-center w-full py-12 gap-4 select-none text-center px-6">
      {/* Icon in a wooden circle */}
      <div
        className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-[#2c160a] text-3xl"
        style={{ backgroundColor: '#eeded1', boxShadow: '3px 3px 0px #2c160a' }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex flex-col gap-2">
        <h3 className="font-serif font-bold text-base text-[#2c160a]">{title}</h3>
        <p className="font-serif text-sm text-[#5e463a] leading-relaxed italic">{message}</p>
      </div>

      {/* Optional action */}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
