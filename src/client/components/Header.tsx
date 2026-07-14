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
    <header className="wood-plank-bg flex flex-col w-full border-b-2 border-[var(--color-border-dark)] px-5 py-4 shadow-md select-none flex-shrink-0">
      {/* Brand & Token row */}
      <div className="flex justify-between items-center w-full mb-3.5">
        <div 
          className="flex flex-col cursor-pointer hover:scale-[1.01] transition-transform"
          onClick={() => navigateTo('welcome')}
        >
          <span className="font-sans font-bold text-lg leading-tight tracking-wide text-[var(--color-text-light)] hover:text-[#eeded1] transition-colors">
            The Last Cafe
          </span>
          <span className="font-handwritten text-xs text-[var(--color-text-muted)] leading-none mt-1">
            on the internet
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Token count display */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[var(--color-border-dark)] border-2 border-[var(--color-text-muted)]/20 rounded-full shadow-inner select-none h-11">
            <span className="text-sm">☕</span>
            <span className="font-sans text-xs font-bold text-[var(--color-text-light)]">
              {tokenCount} {tokenCount === 1 ? 'Token' : 'Tokens'}
            </span>
          </div>

          {/* Daily token claim button */}
          {onClaimToken && (
            <button
              onClick={onClaimToken}
              disabled={hasClaimedToday}
              className={`px-4 h-11 rounded-full text-xs font-sans font-bold border-2 border-[var(--color-border-dark)] shadow-[0_3px_0px_var(--color-border-dark)] active:translate-y-0.5 active:shadow-none transition-all duration-200 cursor-pointer ${
                hasClaimedToday
                  ? 'bg-[#5e463a] text-[var(--color-text-muted)]/70 opacity-60 cursor-not-allowed border-dashed'
                  : 'bg-[var(--color-caramel)] hover:bg-[var(--color-accent-gold)] text-[var(--color-text-light)]'
              }`}
            >
              {hasClaimedToday ? 'Brewed' : 'Brew'}
            </button>
          )}
        </div>
      </div>

      {/* Navigation tabs row */}
      <nav className="flex justify-between items-center w-full mt-3 border-t border-[var(--color-border-dark)]/40 pt-3.5 overflow-x-auto gap-2.5" style={{ scrollbarWidth: 'none' }}>
        {navItems.map((item) => {
          const isActive = currentScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => navigateTo(item.screen)}
              className={`px-3.5 h-11 rounded-md text-xs font-sans tracking-wider font-bold whitespace-nowrap transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer border-2 ${
                isActive
                  ? 'text-[var(--color-text-light)] bg-[var(--color-border-dark)] border-[var(--color-caramel)] shadow-[0_2.5px_0px_var(--color-border-dark)] scale-[1.01]'
                  : 'text-[#eeded1]/75 border-transparent hover:text-[var(--color-text-light)] hover:bg-[#371e0c]/40 hover:scale-[1.01]'
              }`}
            >
              <span className="text-base select-none">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
export default Header;
