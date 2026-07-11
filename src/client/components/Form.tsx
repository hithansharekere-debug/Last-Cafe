import React, { type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type LabelHTMLAttributes } from 'react';

export const Label = ({ children, className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) => {
  return (
    <label
      className={`block font-serif text-xs font-bold text-[#2c160a] uppercase tracking-wider mb-2 select-none ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};

export const Input = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full h-11 px-3 py-2 font-serif text-sm rounded-md border-2 border-[#2c160a] bg-[#fdfaf2] text-[#2c160a] placeholder:text-[#8a6e5f]/60 transition-all focus:outline-none focus:ring-2 focus:ring-[#cf7929] focus:border-[#cf7929] disabled:opacity-45 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full min-h-[140px] px-3 py-2 font-serif text-sm rounded-md border-2 border-[#2c160a] bg-[#fdfaf2] text-[#2c160a] placeholder:text-[#8a6e5f]/60 transition-all focus:outline-none focus:ring-2 focus:ring-[#cf7929] focus:border-[#cf7929] disabled:opacity-45 disabled:cursor-not-allowed resize-y ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full h-11 px-3 py-2 font-serif text-sm rounded-md border-2 border-[#2c160a] bg-[#fdfaf2] text-[#2c160a] transition-all focus:outline-none focus:ring-2 focus:ring-[#cf7929] focus:border-[#cf7929] disabled:opacity-45 disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';
