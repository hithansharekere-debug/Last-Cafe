import React, { useEffect, type ReactNode } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Set max widths matching the responsive specs:
  // Desktop: 700px - 800px, Tablet: 90%, Phone: 95%
  const widthClass = size === 'lg' 
    ? 'w-[95vw] sm:w-[90vw] md:w-[760px]' 
    : size === 'md' 
    ? 'w-[95vw] sm:w-[90vw] md:w-[560px]' 
    : 'w-[95vw] sm:w-[90vw] md:w-[400px]';

  const modalElement = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-md bg-[#26140b]/75 transition-all duration-300"
      onClick={onClose}
    >
      {/* Modal panel with wooden/parchment board aesthetic */}
      <div
        className={`relative ${widthClass} modal-panel-responsive flex flex-col rounded-md border-2 border-[#2c160a] overflow-hidden shadow-[6px_6px_0px_#2c160a] bg-[#fdfaf2] animate-slide-in-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Wooden header bar */}
        <div className="wood-plank-bg flex items-center justify-between px-lg py-md select-none shrink-0">
          {title && (
            <span className="font-serif font-bold text-sm md:text-base text-[#eeded1] tracking-wider">
              {title}
            </span>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-[#eeded1] hover:text-[#fdfaf2] font-mono text-lg md:text-xl leading-none transition-colors cursor-pointer select-none"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Accent strip */}
        <div className="h-0.5 bg-[#cf7929] shrink-0" />

        {/* Content area: Only the body container scrolls */}
        {children}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalElement, document.body);
};

// Modal helpers for structured header/body/footer modals:
export const ModalHeader = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  return (
    <div className={`px-lg py-md border-b border-[#2c160a]/10 shrink-0 ${className}`}>
      {children}
    </div>
  );
};

export const ModalBody = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  return (
    <div className={`modal-body-responsive overflow-y-auto flex-1 font-serif text-[#26140b] ${className}`}>
      {children}
    </div>
  );
};

export const ModalFooter = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  return (
    <div className={`modal-footer-responsive border-t border-[#2c160a]/10 bg-[#eeded1]/30 flex justify-end gap-md shrink-0 ${className}`}>
      {children}
    </div>
  );
};
