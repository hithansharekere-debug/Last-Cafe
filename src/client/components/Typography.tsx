import React from 'react';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const PageTitle = ({ children, className = '', style }: TypographyProps) => {
  return (
    <h1
      className={`font-sans font-bold text-[var(--color-dark-walnut)] tracking-wide ${className}`}
      style={{
        fontSize: 'clamp(28px, 5.5vw, 48px)',
        lineHeight: 1.1,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        wordBreak: 'normal',
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
      className={`font-sans font-bold text-[var(--color-dark-walnut)] leading-normal tracking-wide ${className}`}
      style={{
        fontSize: '24px',
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
      className={`font-sans font-bold text-[var(--color-dark-walnut)] leading-snug ${className}`}
      style={{
        fontSize: '18px',
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
      className={`font-sans text-[var(--color-espresso)] leading-relaxed ${className}`}
      style={{
        fontSize: '16px',
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
      className={`font-sans text-[var(--color-bronze)] leading-normal ${className}`}
      style={{
        fontSize: '14px',
        ...style
      }}
    >
      {children}
    </span>
  );
};

