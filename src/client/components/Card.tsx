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
  // Base cozy styles - rounded corners, border radius, paper feel
  const baseStyle = 'border-2 border-[#2c160a] rounded-lg p-5 relative overflow-hidden transition-all duration-300';
  
  // Shadow/Elevation styles
  const elevationStyles = {
    none: '',
    low: 'shadow-[3px_3px_0px_#2c160a]',
    high: 'shadow-[4px_4px_0px_#2c160a] hover:translate-y-[-3px] hover:translate-x-[-1px] hover:shadow-[6px_6px_0px_#2c160a]',
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
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#cf7929]/30" />
      )}
      
      {/* Torn corner effect for napkins */}
      {variant === 'napkin' && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-[#2c160a] opacity-5 rotate-45 translate-x-1.5 translate-y-[-1.5px]" />
      )}

      {children}
    </div>
  );
};
export default Card;
