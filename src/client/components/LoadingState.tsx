import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = 'Brewing something warm…' }: LoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6 select-none py-12">
      {/* Steam animation above coffee cup */}
      <div className="relative flex flex-col items-center">
        {/* Steam wisps */}
        <div className="flex gap-3 mb-1 h-8">
          <div
            className="animate-steam w-1.5 rounded-full bg-[#c8a285] opacity-40"
            style={{ animationDelay: '0s', height: '24px' }}
          />
          <div
            className="animate-steam w-1.5 rounded-full bg-[#c8a285] opacity-40"
            style={{ animationDelay: '0.4s', height: '20px' }}
          />
          <div
            className="animate-steam w-1.5 rounded-full bg-[#c8a285] opacity-40"
            style={{ animationDelay: '0.8s', height: '24px' }}
          />
        </div>

        {/* Coffee cup SVG icon */}
        <div className="text-5xl animate-float" style={{ lineHeight: 1 }}>
          ☕
        </div>

        {/* Saucer */}
        <div
          className="mt-1 rounded-full border-2 border-[#2c160a]"
          style={{ width: '52px', height: '8px', backgroundColor: '#c8a285' }}
        />
      </div>

      {/* Loading message */}
      <p className="font-serif text-sm text-[#5e463a] italic text-center px-6 leading-relaxed">
        {message}
      </p>

      {/* Animated dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#cf7929]"
            style={{
              animation: 'float 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
