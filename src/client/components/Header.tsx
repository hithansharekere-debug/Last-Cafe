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
    <header className="wood-plank-bg flex flex-col md:flex-row md:items-center md:justify-between w-full border-b-2 border-[var(--color-border-dark)] px-5 py-3 md:py-3.5 shadow-md select-none flex-shrink-0 gap-3 md:gap-lg">
      
      {/* Mobile top row container. Transparent on desktop via md:contents */}
      <div className="flex justify-between items-center w-full md:contents">
        {/* Left Section: Logo */}
        <div 
          className="flex flex-col cursor-pointer hover:scale-[1.01] transition-transform select-none shrink-0 md:order-1"
          onClick={() => navigateTo('welcome')}
        >
          <span className="font-sans font-bold text-base md:text-lg leading-tight tracking-wide text-[var(--color-text-light)]">
            The Last Cafe
          </span>
          <span className="font-handwritten text-[10px] md:text-xs text-[var(--color-text-muted)] leading-none mt-0.5 md:mt-1">
            on the internet
          </span>
        </div>

        {/* Right Section: Status Cluster */}
        <div className="flex items-center gap-2 shrink-0 select-none md:order-3">
          {/* Token count display - Parchment badge */}
          <div className="flex items-center gap-2 px-4 bg-[#F7E9D3] border-2 border-[#9B7653] rounded-full shadow-[0_2px_0px_rgba(44,22,10,0.35)] select-none h-10 md:h-11">
            <span className="text-sm select-none">☕</span>
            <span className="font-sans text-xs font-bold text-[#4B3528]">
              <span className="font-extrabold">{tokenCount}</span> {tokenCount === 1 ? 'Token' : 'Tokens'}
            </span>
          </div>

          {/* Daily token claim button - Carved wood button */}
          {onClaimToken && (
            <button
              onClick={onClaimToken}
              disabled={hasClaimedToday}
              className={`px-4 h-10 md:h-11 rounded-full text-xs font-sans font-bold border-2 shadow-[0_2px_0px_rgba(44,22,10,0.35)] transition-all duration-200 cursor-pointer ${
                hasClaimedToday
                  ? 'bg-[#5c3d25] border-[#4b3528] border-dashed text-[#FFF5E8]/50 shadow-none opacity-60 cursor-not-allowed'
                  : 'bg-gradient-to-b from-[#8C6846] to-[#6A4A33] border-[#543b27] text-[#FFF5E8] hover:from-[#9d7854] hover:to-[#7a583f] active:translate-y-0.5 active:shadow-none'
              }`}
            >
              {hasClaimedToday ? 'Brewed' : 'Brew'}
            </button>
          )}
        </div>
      </div>

      {/* Center Section: Navigation (centered on desktop, full-width overflow on mobile) */}
      <nav className="flex items-center justify-start md:justify-center overflow-x-auto gap-2.5 md:gap-3.5 py-1 select-none scrollbar-none md:flex-1 w-full md:w-auto md:order-2 md:border-t-0 md:pt-0 border-t border-[var(--color-border-dark)]/40 pt-3" style={{ scrollbarWidth: 'none' }}>
        {navItems.map((item) => {
          const isActive = currentScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => navigateTo(item.screen)}
              className={`px-3.5 h-10 md:h-11 rounded-md text-xs font-sans tracking-wider font-bold whitespace-nowrap transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer border-2 select-none ${
                isActive
                  ? 'text-[#4B3528] bg-[#F7E9D3] border-[#9B7653] shadow-[0_2px_0px_rgba(44,22,10,0.35)] translate-y-0.5'
                  : 'text-[#eeded1]/75 bg-[#371e0c]/30 border-[#2c160a]/40 shadow-[0_2px_0px_rgba(44,22,10,0.15)] hover:text-[var(--color-text-light)] hover:bg-[#371e0c]/45 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
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
