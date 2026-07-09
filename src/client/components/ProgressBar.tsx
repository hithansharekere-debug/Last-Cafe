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
    <div className="flex flex-col w-full gap-1.5 select-none font-serif">
      {/* Label and percentage info */}
      <div className="flex justify-between items-baseline w-full text-xs">
        {label && <span className="font-bold text-[#2c160a]">{label}</span>}
        {showPercent && (
          <span className="font-mono text-[#5e463a]">
            {value} / {max} ({percentage}%)
          </span>
        )}
      </div>

      {/* Progress track */}
      <div className="w-full h-4 bg-[#eeded1] border-2 border-[#2c160a] rounded overflow-hidden relative shadow-inner">
        {/* Steam overlay line effect */}
        <div 
          className="h-full bg-[#cf7929] transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        />
        
        {/* Bubble particles inside showing heat */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-[#fdfaf2]/10 to-transparent pointer-events-none"
        />
      </div>

      {/* Sublabel descriptor */}
      {subLabel && <span className="text-[10px] text-[#5e463a] italic">{subLabel}</span>}
    </div>
  );
};
