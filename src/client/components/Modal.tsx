import React, { useEffect, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(38,20,11,0.75)',
        cursor: 'default',
      }}
      onClick={onClose}
    >
      {/* Modal panel — wooden board aesthetic */}
      <div
        className="animate-slide-in"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '380px',
          borderRadius: '4px',
          border: '2px solid #2c160a',
          overflow: 'hidden',
          boxShadow: '6px 6px 0px #2c160a',
          backgroundColor: '#fdfaf2',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Wooden header bar */}
        <div className="wood-plank-bg flex items-center justify-between px-4 py-3">
          {title && (
            <span className="font-serif font-bold text-sm text-[#fdfaf2] tracking-wider">
              {title}
            </span>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-[#eeded1] hover:text-[#fdfaf2] font-mono text-lg leading-none transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Amber top edge accent */}
        <div className="h-0.5 bg-[#cf7929]" />

        {/* Content area on parchment */}
        <div className="p-5 font-serif text-[#26140b]">
          {children}
        </div>
      </div>
    </div>
  );
};
