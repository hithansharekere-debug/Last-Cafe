import React from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useNavigation } from '../context/NavigationContext';

export const WelcomeScreen = () => {
  const { navigateTo } = useNavigation();

  const rules = [
    {
      icon: '☕',
      title: 'One Token a Day',
      text: 'Visit daily to claim your coffee token. Each token lets you leave one meaningful contribution.',
    },
    {
      icon: '📝',
      title: 'Leave a Note',
      text: 'Spend your token to leave a memory, a piece of advice, or a secret for future visitors.',
    },
    {
      icon: '🔑',
      title: 'Unlock New Rooms',
      text: 'As the community contributes, new rooms slowly open — the Fireplace, the Library, the Garden.',
    },
    {
      icon: '⏳',
      title: 'Time Capsules',
      text: 'Leave a message that only unlocks on a future date. Your words wait patiently in the dark.',
    },
  ];

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto bg-[var(--color-parchment)] animate-fade-in">
      {/* Hero section */}
      <div
        className="flex flex-col items-center justify-center py-10 px-6 text-center border-b-2 border-[var(--color-border-dark)]"
        style={{
          backgroundColor: 'var(--color-cream)',
          backgroundImage: 'radial-gradient(var(--color-paper-shadow) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        <div className="relative mb-4 flex items-center justify-center select-none" style={{ height: '70px', width: '70px' }}>
          {/* Steam wisps */}
          <span className="absolute text-xl animate-steam" style={{ top: '-15px', left: '20px', animationDelay: '0s' }}>☁️</span>
          <span className="absolute text-xl animate-steam" style={{ top: '-15px', left: '35px', animationDelay: '0.8s' }}>☁️</span>
          <span className="absolute text-xl animate-steam" style={{ top: '-15px', left: '10px', animationDelay: '1.6s' }}>☁️</span>
          <span className="text-6xl animate-float">☕</span>
        </div>
        
        <h1 className="font-sans font-bold text-2xl text-[var(--color-dark-walnut)] leading-tight mb-2 tracking-wide" style={{ fontSize: 'clamp(26px, 4.5vw, 32px)' }}>
          The Last Cafe<br />on the Internet
        </h1>
        
        <p className="font-sans text-sm text-[var(--color-espresso)] italic leading-relaxed max-w-xs mb-6">
          A quiet corner of Reddit where strangers leave something real for one another.
          Pull up a chair. Stay a while.
        </p>
        
        <Button variant="primary" size="lg" onClick={() => navigateTo('cafe')}>
          Step Inside →
        </Button>
      </div>

      {/* Rules section */}
      <div className="flex flex-col gap-4 p-5">
        <h2 className="font-sans font-bold text-sm text-[var(--color-dark-walnut)] px-1 flex items-center gap-2">
          <span>📋</span> How the Cafe Works
        </h2>
        
        <div className="flex flex-col gap-3.5">
          {rules.map((rule) => (
            <Card key={rule.title} variant="napkin" elevation="high" className="hover:scale-[1.01]">
              <div className="flex gap-4 items-start">
                <span className="text-3xl flex-shrink-0 mt-0.5 select-none">{rule.icon}</span>
                <div className="flex flex-col gap-1">
                  <span className="font-sans font-bold text-sm text-[var(--color-dark-walnut)]">{rule.title}</span>
                  <span className="font-sans text-xs text-[var(--color-espresso)] leading-relaxed">{rule.text}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Blackboard Category teaser */}
      <div
        className="mx-5 mb-5 mt-1 rounded-lg border-2 border-[var(--color-border-dark)] p-5 shadow-[4px_4px_0px_var(--color-border-dark)]"
        style={{
          backgroundColor: 'var(--color-parchment)',
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(59,39,28,0.03) 10px, rgba(59,39,28,0.03) 20px)',
        }}
      >
        <p className="font-sans text-[11px] text-[var(--color-dark-walnut)] font-bold uppercase tracking-widest mb-3 select-none">
          🍰 You can write & read…
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { tag: 'Memory', emoji: '💭' },
            { tag: 'Advice', emoji: '🌿' },
            { tag: 'Gratitude', emoji: '🙏' },
            { tag: 'Recommendation', emoji: '📚' },
            { tag: 'Secret', emoji: '🤫' },
            { tag: 'Time Capsule', emoji: '⏳' },
            { tag: 'Dream', emoji: '🌌' },
            { tag: 'Question', emoji: '❓' }
          ].map(({ tag, emoji }) => (
            <span
              key={tag}
              className="px-2.5 py-1 text-xs font-sans rounded border border-[var(--color-border-dark)] bg-[var(--color-cream)] text-[var(--color-dark-walnut)] font-bold shadow-[1.5px_1.5px_0px_var(--color-border-dark)] select-none"
            >
              {emoji} {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Navigate to discover */}
      <div className="px-5 pb-8 text-center">
        <button
          onClick={() => navigateTo('discover')}
          className="font-sans text-xs text-[var(--color-espresso)] italic underline underline-offset-2 hover:text-[var(--color-caramel)] transition-colors cursor-pointer"
        >
          Read what others have left →
        </button>
      </div>
    </div>
  );
};
