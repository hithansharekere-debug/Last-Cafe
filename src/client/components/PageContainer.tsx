import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer = ({ children, className = '' }: PageContainerProps) => {
  return (
    <div className={`w-full max-w-[1200px] mx-auto flex flex-col gap-lg p-lg animate-fade-in ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
