import React from 'react';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const PageTitle = ({ children, className = '', style }: TypographyProps) => {
  return (
    <h1
      className={`font-serif font-bold text-[#2c160a] leading-tight tracking-wide ${className}`}
      style={{
        fontSize: 'clamp(1.4rem, 4vw, 2rem)',
        ...style
      }}
    >
      {children}
    </h1>
  );
};

export const SectionTitle = ({ children, className = '', style }: TypographyProps) => {
  return (
    <h2
      className={`font-serif font-bold text-[#2c160a] leading-normal tracking-wide ${className}`}
      style={{
        fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
        ...style
      }}
    >
      {children}
    </h2>
  );
};

export const CardTitle = ({ children, className = '', style }: TypographyProps) => {
  return (
    <h3
      className={`font-serif font-bold text-[#2c160a] leading-snug ${className}`}
      style={{
        fontSize: '1.1rem',
        ...style
      }}
    >
      {children}
    </h3>
  );
};

export const BodyText = ({ children, className = '', style }: TypographyProps) => {
  return (
    <p
      className={`font-serif text-[#5e463a] leading-relaxed ${className}`}
      style={{
        fontSize: '0.95rem',
        maxWidth: '65ch',
        ...style
      }}
    >
      {children}
    </p>
  );
};

export const Caption = ({ children, className = '', style }: TypographyProps) => {
  return (
    <span
      className={`font-serif text-[#8a6e5f] leading-normal ${className}`}
      style={{
        fontSize: '0.85rem',
        ...style
      }}
    >
      {children}
    </span>
  );
};
