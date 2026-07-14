import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  subLabel?: string;
  showPercent?: boolean;
}

export const ProgressBar = ({
  value,
  max,
  label,
  subLabel,
  showPercent = true,
}: ProgressBarProps) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className="flex flex-col w-full gap-2 select-none font-sans">
      {/* Label and percentage info */}
      <div className="flex justify-between items-center w-full text-xs">
        {label && (
          <span className="font-sans font-bold text-xs uppercase tracking-wider text-[var(--color-dark-walnut)]">
            {label}
          </span>
        )}
        {showPercent && (
          <span className="font-mono text-xs text-[var(--color-dark-walnut)] font-bold bg-[var(--color-cream)] px-2.5 py-1 rounded border border-[var(--color-border-dark)] shadow-[0_2px_0px_var(--color-border-dark)]">
            {value} / {max} ({percentage}%)
          </span>
        )}
      </div>

      {/* Progress track - Dark carved wood look */}
      <div className="w-full h-5 bg-[#5A3F2B] border-2 border-[#7B5A3F] rounded-full overflow-hidden relative shadow-[inset_0_2.5px_4px_rgba(0,0,0,0.4)] p-[1.5px]">
        {/* Progress fill - Warm caramel candlelit gradient */}
        <div 
          className="h-full rounded-full bg-gradient-to-r from-[#C97B2E] via-[#E7A94A] to-[#F3C46B] transition-all duration-300 ease-out shadow-[inset_0_1.5px_0px_rgba(255,255,255,0.45),_inset_0_-1.5px_0px_rgba(0,0,0,0.15)]" 
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Sublabel descriptor */}
      {subLabel && (
        <span className="text-[11px] text-[var(--color-espresso)] italic leading-relaxed mt-0.5">
          {subLabel}
        </span>
      )}
    </div>
  );
};
