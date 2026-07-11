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
  // Base cozy styles - larger click targets, rounded corners, soft presses
  const baseStyle = 'inline-flex items-center justify-center font-serif rounded-md border-2 border-[#2c160a] transition-all duration-150 select-none shadow-[3px_3px_0px_#2c160a] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none disabled:opacity-45 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:translate-x-0 disabled:active:shadow-[3px_3px_0px_#2c160a]';
  
  // Size styles
  const sizeStyles = {
    sm: 'px-4 py-2 text-xs tracking-wider font-bold',
    md: 'px-5.5 py-2.5 text-sm tracking-wide font-bold',
    lg: 'px-7 py-3.5 text-base font-bold tracking-wider',
  };

  // Variant styles
  const variantStyles = {
    primary: 'bg-[#cf7929] hover:bg-[#b05c14] text-[#fdfaf2] hover:scale-[1.01]',
    secondary: 'bg-[#eeded1] hover:bg-[#e2cbba] text-[#2c160a] hover:scale-[1.01]',
    outline: 'bg-transparent hover:bg-[#f7edd7]/50 text-[#2c160a]',
    wood: 'bg-[#5c371d] hover:bg-[#3d200e] text-[#eeded1] border-[#2c160a] hover:scale-[1.01]',
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
