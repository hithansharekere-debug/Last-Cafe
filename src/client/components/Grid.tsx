import React from 'react';

interface GridProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveCardGrid = ({ children, className = '' }: GridProps) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg ${className}`}>
      {children}
    </div>
  );
};

export const ResponsiveStatsGrid = ({ children, className = '' }: GridProps) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-md ${className}`}>
      {children}
    </div>
  );
};

export const ResponsiveListGrid = ({ children, className = '' }: GridProps) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-lg ${className}`}>
      {children}
    </div>
  );
};
