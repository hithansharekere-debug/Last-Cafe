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
    <header className="wood-plank-bg flex flex-col w-full border-b-2 border-[#2c160a] p-4 shadow-md select-none flex-shrink-0">
      {/* Brand & Token row */}
      <div className="flex justify-between items-center w-full mb-3">
        <div 
          className="flex flex-col cursor-pointer hover:scale-[1.01] transition-transform"
          onClick={() => navigateTo('welcome')}
        >
          <span className="font-serif font-bold text-lg leading-tight tracking-wide text-[#fdfaf2] hover:text-[#eeded1] transition-colors">
            The Last Cafe
          </span>
          <span className="font-handwritten text-xs text-[#c8a285] leading-none mt-0.5">
            on the internet
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Token count display */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2c160a] border-2 border-[#eeded1]/20 rounded-full shadow-inner select-none">
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
              className={`px-3 py-2 rounded-full text-xs font-serif font-bold border-2 border-[#2c160a] shadow-[2px_2px_0px_#2c160a] active:translate-y-0.5 active:shadow-none transition-all duration-200 cursor-pointer ${
                hasClaimedToday
                  ? 'bg-[#5e463a] text-[#c8a285]/70 opacity-60 cursor-not-allowed border-dashed'
                  : 'bg-[#cf7929] hover:bg-[#a85012] text-[#fdfaf2]'
              }`}
            >
              {hasClaimedToday ? 'Brewed' : 'Brew'}
            </button>
          )}
        </div>
      </div>

      {/* Navigation tabs row */}
      <nav className="flex justify-between items-center w-full mt-2 border-t border-[#2c160a]/40 pt-2.5 overflow-x-auto gap-1.5" style={{ scrollbarWidth: 'none' }}>
        {navItems.map((item) => {
          const isActive = currentScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => navigateTo(item.screen)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-serif tracking-wider font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1 cursor-pointer border ${
                isActive
                  ? 'text-[#fdfaf2] bg-[#2c160a] border-[#cf7929] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.5)]'
                  : 'text-[#eeded1] hover:text-[#fdfaf2] hover:bg-[#371e0c]/30 border-transparent'
              }`}
            >
              <span className="text-sm select-none">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
export default Header;
