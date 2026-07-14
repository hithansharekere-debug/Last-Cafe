import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer = ({ children, className = '' }: PageContainerProps) => {
  return (
    <div className={`w-full max-w-[1200px] mx-auto flex flex-col gap-12 p-md sm:p-lg md:p-xl animate-fade-in ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
