import React from 'react';

interface ResponsiveFrameProps {
  children: React.ReactNode;
}

export const ResponsiveFrame = ({ children }: ResponsiveFrameProps) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#26140b] overflow-hidden">
      <div className="w-full h-full max-w-[1400px] mx-auto flex flex-col relative overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default ResponsiveFrame;
