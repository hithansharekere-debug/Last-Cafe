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
  // Enforced Button Design System: same height (44px/h-11), same border radius (8px/rounded-lg), same padding (px-24), same font size (16px), consistent shadows
  // Hover: lift 2px. Pressed: translate down 2px, remove shadow.
  const baseStyle = 'inline-flex items-center justify-center font-serif text-[16px] font-bold h-11 px-24 rounded-lg border-2 border-[#2c160a] transition-all duration-150 select-none shadow-[4px_4px_0px_#2c160a] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_#2c160a] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:translate-x-0 disabled:hover:shadow-[4px_4px_0px_#2c160a] disabled:active:translate-y-0 disabled:active:shadow-[4px_4px_0px_#2c160a]';
  
  // Cozy Palette Colors
  const variantStyles = {
    // Accent Caramel Button
    primary: 'bg-[#cf7929] hover:bg-[#b05c14] text-[#fdfaf2]',
    // Light cream Button
    secondary: 'bg-[#f7edd7] hover:bg-[#e2cbba] text-[#2c160a]',
    // Outlined Button
    outline: 'bg-transparent hover:bg-[#f7edd7]/50 text-[#2c160a]',
    // Coffee Brown Button
    wood: 'bg-[#5c371d] hover:bg-[#3d200e] text-[#eeded1]',
  };

  const widthStyle = fullWidth ? 'w-full' : 'w-auto';

  return (
    <button
      disabled={disabled}
      className={`${baseStyle} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

