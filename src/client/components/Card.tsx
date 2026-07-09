import React, { type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'parchment' | 'wood' | 'napkin' | 'deck';
  elevation?: 'none' | 'low' | 'high';
}

export const Card = ({
  children,
  variant = 'parchment',
  elevation = 'low',
  className = '',
  ...props
}: CardProps) => {
  // Base cozy styles
  const baseStyle = 'border-2 border-[#2c160a] rounded p-4 relative overflow-hidden transition-all duration-200';
  
  // Shadow/Elevation styles
  const elevationStyles = {
    none: '',
    low: 'shadow-[2px_2px_0px_rgba(44,22,10,1)]',
    high: 'shadow-[4px_4px_0px_rgba(44,22,10,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(44,22,10,1)]',
  };

  // Variant/Theme styles
  const variantStyles = {
    // Parchment paper sheet
    parchment: 'bg-[#fdfaf2] text-[#2c160a]',
    // Darker wood paneling
    wood: 'bg-[#5c371d] text-[#fdfaf2] border-[#2c160a]',
    // Napkin styling (torn page feel)
    napkin: 'bg-[#f7edd7] text-[#26140b] border-dashed border-2',
    // Paper cards
    deck: 'bg-[#eeded1] text-[#371e0c] border-[#2c160a]',
  };

  return (
    <div
      className={`${baseStyle} ${elevationStyles[elevation]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {/* Subtle top decoration for parchment card like a letter or journal binding */}
      {variant === 'parchment' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#cf7929]/20" />
      )}
      
      {/* Torn corner effect for napkins */}
      {variant === 'napkin' && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-[#2c160a] opacity-5 rotate-45 translate-x-1.5 translate-y-[-1.5px]" />
      )}

      {children}
    </div>
  );
};
