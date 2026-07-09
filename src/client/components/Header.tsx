import React from 'react';
import { useNavigation, type ScreenType } from '../context/NavigationContext';

interface HeaderProps {
  tokenCount: number;
  onClaimToken?: () => void;
  hasClaimedToday?: boolean;
}

export const Header = ({ tokenCount, onClaimToken, hasClaimedToday = false }: HeaderProps) => {
  const { currentScreen, navigateTo } = useNavigation();

  const navItems: { label: string; screen: ScreenType }[] = [
    { label: 'Cafe', screen: 'cafe' },
    { label: 'Table', screen: 'table' },
    { label: 'Discover', screen: 'discover' },
    { label: 'Puzzle', screen: 'puzzle' },
    { label: 'Library Card', screen: 'profile' },
  ];

  return (
    <header className="wood-plank-bg flex flex-col w-full border-b-2 border-[#2c160a] p-3 shadow-md select-none">
      {/* Brand & Token row */}
      <div className="flex justify-between items-center w-full mb-2.5">
        <div 
          className="flex flex-col cursor-pointer"
          onClick={() => navigateTo('welcome')}
        >
          <span className="font-serif font-bold text-lg leading-tight tracking-wide text-[#fdfaf2] hover:text-[#eeded1] transition-colors">
            The Last Cafe
          </span>
          <span className="font-handwritten text-xs text-[#c8a285] leading-none">
            on the internet
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Token count display */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2c160a] border border-[#eeded1] rounded-full shadow-inner">
            <span className="text-sm">☕</span>
            <span className="font-mono text-xs font-bold text-[#fdfaf2]">
              {tokenCount} {tokenCount === 1 ? 'Token' : 'Tokens'}
            </span>
          </div>

          {/* Daily token claim button */}
          {onClaimToken && (
            <button
              onClick={onClaimToken}
              disabled={hasClaimedToday}
              className={`px-3 py-1.5 rounded-full text-xs font-serif border border-[#2c160a] shadow transition-all duration-200 ${
                hasClaimedToday
                  ? 'bg-[#5e463a] text-[#c8a285] opacity-60 cursor-not-allowed'
                  : 'bg-[#cf7929] hover:bg-[#a85012] text-[#fdfaf2] active:translate-y-0.5'
              }`}
            >
              {hasClaimedToday ? 'Claimed' : 'Claim Daily'}
            </button>
          )}
        </div>
      </div>

      {/* Navigation tabs row */}
      <nav className="flex justify-between items-center w-full mt-1.5 border-t border-[#371e0c] pt-2 overflow-x-auto gap-1">
        {navItems.map((item) => {
          const isActive = currentScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => navigateTo(item.screen)}
              className={`px-3 py-1 rounded text-xs font-serif tracking-wider whitespace-nowrap transition-all duration-150 relative ${
                isActive
                  ? 'text-[#df8a27] font-bold underline decoration-2 underline-offset-4'
                  : 'text-[#eeded1] hover:text-[#fdfaf2] hover:bg-[#371e0c]/30'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
