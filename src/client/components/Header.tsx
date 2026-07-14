import React from 'react';
import { useNavigation, type ScreenType } from '../context/NavigationContext';

interface HeaderProps {
  tokenCount: number;
  onClaimToken?: () => void;
  hasClaimedToday?: boolean;
}

export const Header = ({ tokenCount, onClaimToken, hasClaimedToday = false }: HeaderProps) => {
  const { currentScreen, navigateTo } = useNavigation();

  const navItems: { label: string; screen: ScreenType; icon: string }[] = [
    { label: 'Cafe', screen: 'cafe', icon: '☕' },
    { label: 'Table', screen: 'table', icon: '🪑' },
    { label: 'Discover', screen: 'discover', icon: '🔍' },
    { label: 'Puzzle', screen: 'puzzle', icon: '🧩' },
    { label: 'Library Card', screen: 'profile', icon: '📋' },
  ];

  return (
    <header className="wood-plank-bg flex flex-col w-full border-b-2 border-[#2c160a] p-16 shadow-sm select-none flex-shrink-0">
      {/* Brand & Token row */}
      <div className="flex justify-between items-center w-full mb-16 h-11">
        {/* Brand Name */}
        <div 
          className="flex flex-col cursor-pointer hover:-translate-y-0.5 transition-all duration-150 justify-center"
          onClick={() => navigateTo('welcome')}
        >
          <span className="font-serif font-bold text-[20px] leading-none tracking-wide text-[#fdfaf2] hover:text-[#eeded1] transition-colors">
            The Last Cafe
          </span>
          <span className="font-handwritten text-[13px] text-[#c8a285] leading-none mt-4">
            on the internet
          </span>
        </div>

        {/* Tokens & Claim Counter HUD */}
        <div className="flex items-center gap-8 h-full">
          {/* Token count display */}
          <div className="flex items-center gap-8 px-16 h-11 bg-[#2c160a] border-2 border-[#eeded1]/20 rounded-full shadow-inner select-none justify-center">
            <span className="text-[16px] leading-none mt-0.5">☕</span>
            <span className="font-mono text-[14px] font-bold text-[#fdfaf2] leading-none">
              {tokenCount} {tokenCount === 1 ? 'Token' : 'Tokens'}
            </span>
          </div>

          {/* Daily token claim button */}
          {onClaimToken && (
            <button
              onClick={onClaimToken}
              disabled={hasClaimedToday}
              className={`h-11 px-16 rounded-full text-[14px] font-serif font-bold border-2 border-[#2c160a] shadow-[2px_2px_0px_#2c160a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#2c160a] active:translate-y-0.5 active:shadow-none transition-all duration-150 cursor-pointer ${
                hasClaimedToday
                  ? 'bg-[#5e463a] text-[#c8a285]/70 opacity-60 cursor-not-allowed border-dashed hover:translate-y-0 hover:shadow-[2px_2px_0px_#2c160a] active:translate-y-0'
                  : 'bg-[#cf7929] hover:bg-[#a85012] text-[#fdfaf2]'
              }`}
            >
              {hasClaimedToday ? 'Brewed' : 'Brew'}
            </button>
          )}
        </div>
      </div>

      {/* Navigation tabs row */}
      <nav className="flex justify-between items-center w-full mt-8 border-t border-[#2c160a]/40 pt-16 overflow-x-auto gap-8" style={{ scrollbarWidth: 'none' }}>
        {navItems.map((item) => {
          const isActive = currentScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => navigateTo(item.screen)}
              className={`px-16 py-8 rounded-lg text-[15px] font-serif tracking-wide font-medium whitespace-nowrap transition-all duration-150 flex items-center gap-8 cursor-pointer border ${
                isActive
                  ? 'text-[#fdfaf2] bg-[#2c160a] border-[#cf7929] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.5)]'
                  : 'text-[#eeded1] hover:text-[#fdfaf2] hover:bg-[#371e0c]/30 border-transparent'
              }`}
            >
              <span className="text-[16px] select-none leading-none">{item.icon}</span>
              <span className="leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};

export default Header;
