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
    { label: 'Library', screen: 'profile', icon: '📋' },
  ];

  return (
    <header 
      className="wood-plank-bg w-full border-b-2 border-[var(--color-border-dark)] px-5 py-3 shadow-md select-none flex-shrink-0"
      style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', boxSizing: 'border-box', gap: '16px' }}
    >
      {/* Left/Center Column: Navigation */}
      <nav className="wood-nav-container">
        {navItems.map((item) => {
          const isActive = currentScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => navigateTo(item.screen)}
              className={isActive ? 'wood-nav-tab active' : 'wood-nav-tab inactive'}
            >
              <span className="text-base select-none">{item.icon}</span>
              <span className="nav-tab-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Column: Unified Status Badge */}
      <div 
        className="header-status-container"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '4px', flexShrink: 0 }}
      >
        <div className="header-unified-badge">
          {/* Left Part: Tokens Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px', height: '100%' }}>
            <span className="text-sm select-none">☕</span>
            <span style={{ whiteSpace: 'nowrap' }}>
              <span className="status-badge-desktop font-extrabold">{tokenCount} {tokenCount === 1 ? 'Token' : 'Tokens'}</span>
              <span className="status-badge-mobile font-extrabold">x{tokenCount}</span>
            </span>
          </div>

          {/* Separator & Claim Button */}
          {onClaimToken && (
            <>
              <div style={{ width: '1px', alignSelf: 'stretch', backgroundColor: '#9B7653', opacity: 0.5 }} />
              {hasClaimedToday ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', height: '100%', color: '#8C6846', opacity: 0.8, whiteSpace: 'nowrap' }}>
                  <span className="status-brewed-desktop">✓ Brewed</span>
                  <span className="status-brewed-mobile">✓</span>
                </div>
              ) : (
                <button
                  onClick={onClaimToken}
                  className="header-unified-brew-btn"
                >
                  Brew
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
export default Header;
