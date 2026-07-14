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
    <div className="flex flex-col w-full h-full overflow-y-auto bg-[#fdfaf2] animate-fade-in select-text">
      {/* Hero section */}
      <div
        className="flex flex-col items-center justify-center text-center border-b-2 border-[#2c160a] py-48 px-24"
        style={{
          backgroundColor: '#f7edd7',
          backgroundImage: 'radial-gradient(var(--color-paper-shadow) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        <div className="relative mb-24 flex items-center justify-center select-none" style={{ height: '70px', width: '70px' }}>
          {/* Steam wisps */}
          <span className="absolute text-xl animate-steam" style={{ top: '-15px', left: '20px', animationDelay: '0s' }}>☁️</span>
          <span className="absolute text-xl animate-steam" style={{ top: '-15px', left: '35px', animationDelay: '0.8s' }}>☁️</span>
          <span className="absolute text-xl animate-steam" style={{ top: '-15px', left: '10px', animationDelay: '1.6s' }}>☁️</span>
          <span className="text-6xl animate-float">☕</span>
        </div>
        
        <h1 className="font-serif font-bold text-[34px] md:text-[48px] text-[#26140b] leading-tight mb-16 tracking-wide max-w-[18ch]">
          The Last Cafe on the Internet
        </h1>
        
        <p className="font-serif text-[16px] leading-[1.6] text-[#5e463a] italic max-w-[44ch] mb-32">
          A quiet corner of Reddit where strangers leave something real for one another.
          Pull up a chair. Stay a while.
        </p>
        
        <Button variant="primary" onClick={() => navigateTo('cafe')}>
          Step Inside →
        </Button>
      </div>

      {/* Rules section */}
      <div className="flex flex-col gap-24 p-24 max-w-[800px] mx-auto w-full">
        <h2 className="font-serif font-bold text-[28px] text-[#2c160a] px-8 flex items-center gap-8">
          <span>📋</span> How the Cafe Works
        </h2>
        
        <div className="flex flex-col gap-16 w-full">
          {rules.map((rule) => (
            <Card key={rule.title} variant="napkin" elevation="high" className="hover:-translate-y-0.5 transition-all duration-150 p-24 rounded-lg bg-[#f7edd7] border-2 border-[#2c160a] shadow-[3px_3px_0px_#2c160a]">
              <div className="flex gap-24 items-start">
                <span className="text-[32px] flex-shrink-0 mt-4 select-none leading-none">{rule.icon}</span>
                <div className="flex flex-col gap-8 flex-1">
                  <h3 className="font-serif font-semibold text-[20px] text-[#26140b] leading-tight">
                    {rule.title}
                  </h3>
                  <p className="font-sans text-[16px] leading-[1.6] text-[#5e463a]">
                    {rule.text}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Blackboard Category teaser */}
      <div
        className="mx-24 mb-24 mt-8 rounded-lg border-2 border-[#2c160a] p-24 shadow-[4px_4px_0px_#2c160a] max-w-[800px] md:mx-auto w-calc"
        style={{
          backgroundColor: '#eeded1',
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(44,22,10,0.03) 10px, rgba(44,22,10,0.03) 20px)',
          width: 'calc(100% - 48px)',
        }}
      >
        <p className="font-serif text-[14px] text-[#5e463a] font-bold uppercase tracking-widest mb-16 select-none">
          🍰 You can write & read…
        </p>
        <div className="flex flex-wrap gap-8">
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
              className="px-16 py-8 text-[14px] font-sans rounded-full border border-[#2c160a] bg-[#fdfaf2] text-[#2c160a] font-medium shadow-[2px_2px_0px_#2c160a] select-none hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#2c160a] transition-all duration-150"
            >
              {emoji} {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Navigate to discover */}
      <div className="px-24 pb-32 text-center">
        <button
          onClick={() => navigateTo('discover')}
          className="font-serif text-[14px] text-[#5e463a] italic underline underline-offset-4 hover:text-[#cf7929] transition-colors cursor-pointer"
        >
          Read what others have left →
        </button>
      </div>
    </div>
  );
};
export default WelcomeScreen;
