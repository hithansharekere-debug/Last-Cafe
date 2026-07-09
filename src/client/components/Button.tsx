import React, { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'wood';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  // Base cozy styles
  const baseStyle = 'inline-flex items-center justify-center font-serif rounded border-2 border-[#2c160a] transition-all duration-150 select-none shadow-[2px_2px_0px_rgba(44,22,10,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_rgba(44,22,10,1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0';
  
  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs tracking-wider',
    md: 'px-5 py-2 text-sm tracking-wide',
    lg: 'px-7 py-3 text-base font-bold tracking-wider',
  };

  // Variant styles
  const variantStyles = {
    primary: 'bg-[#cf7929] hover:bg-[#a85012] text-[#fdfaf2]',
    secondary: 'bg-[#eeded1] hover:bg-[#c8a285] text-[#2c160a]',
    outline: 'bg-transparent hover:bg-[#f7edd7]/40 text-[#2c160a]',
    wood: 'bg-[#5c371d] hover:bg-[#371e0c] text-[#fdfaf2] border-[#2c160a]',
  };

  const widthStyle = fullWidth ? 'w-full' : 'w-auto';

  return (
    <button
      disabled={disabled}
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
